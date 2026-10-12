-- Tests pgTAP des règles métier (stock, numérotation, annulation, inscription, stats, RLS).
-- Indépendants du seed : données propres, rollback final.
begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 't-admin@emd.test'),
  ('00000000-0000-0000-0000-0000000000c1', 't-client@emd.test'),
  ('00000000-0000-0000-0000-0000000000c2', 't-other@emd.test');
insert into profiles (id, role, first_name, last_name, email)
  values ('00000000-0000-0000-0000-0000000000a1', 'admin', 'Admin', 'EMD', 't-admin@emd.test');

create function pg_temp.login(uid uuid) returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;
create function pg_temp.sql_state_msg(q text) returns text language plpgsql as $$
begin execute q; return 'ok'; exception when others then return sqlerrm; end $$;

-- Inscription
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select register_company('11111111111119', 'Test Wilson SAS', '1 rue Test', '75001', 'Paris', 'Camille', 'Martin', null);
select is((select status from companies where siret = '11111111111119'), 'pending', 'entreprise créée en attente');
select is((select count(*) from stores where company_id = my_company_id())::int, 1, 'premier magasin créé');
select is((select count(*) from admin_notifications where type = 'signup_request' and body = 'Test Wilson SAS')::int, 0,
  'le client ne lit pas les notifications admin');
select is(pg_temp.sql_state_msg($q$select register_company('11111111111119','X','a','75001','Paris','a','b',null)$q$),
  'already_registered', 'double inscription refusée');
select pg_temp.login('00000000-0000-0000-0000-0000000000c2');
select throws_ok($q$select register_company('11111111111119','X','a','75001','Paris','a','b',null)$q$, '23505',
  null, 'SIRET déjà inscrit');

reset role;
select is((select count(*) from admin_notifications where type = 'signup_request' and body = 'Test Wilson SAS')::int, 1,
  'notification admin d''inscription');

insert into products (reference, ean, title, price_ht, stock) values
  ('T-AN-100', '9990000000011', 'Ambre Test 100 ml', 38.50, 130),
  ('T-CM-075', '9990000000028', 'Crème Test 75 ml', 7.20, 4),
  ('T-HIDDEN', '9990000000035', 'Produit masqué', 5.00, 50);
update products set is_visible = false where reference = 'T-HIDDEN';
create temp table ids as select
  (select id from stores where company_id = (select id from companies where siret = '11111111111119')) as store,
  (select id from products where reference = 'T-AN-100') as p1,
  (select id from products where reference = 'T-CM-075') as p2,
  (select id from products where reference = 'T-HIDDEN') as p3;
grant select on ids to authenticated;

-- Compte non validé : pas de commande, pas de catalogue
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select is(pg_temp.sql_state_msg(format($q$select place_order(%L, null, '[]')$q$, (select store from ids))),
  'company_not_active', 'commande refusée avant validation');
select is((select count(*) from products where reference like 'T-%')::int, 0, 'catalogue invisible avant validation');

-- Client ne peut pas se valider lui-même
select is(pg_temp.sql_state_msg(format($q$select set_company_status(%L, 'active')$q$, my_company_id())),
  'forbidden', 'client ne change pas le statut');
select is(pg_temp.sql_state_msg($q$update companies set status = 'active'$q$), 'ok', 'update silencieux (RLS)');
select is((select status from companies), 'pending', 'statut inchangé');

-- Validation par l'admin
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select set_company_status((select id from companies where siret = '11111111111119'), 'active');
select isnt((select validated_at from companies where siret = '11111111111119'), null, 'validated_at renseigné');
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select is((select count(*) from products where reference like 'T-%')::int, 2, 'catalogue visible, produit masqué exclu');

-- Stock insuffisant ou produit masqué : rien n'est écrit
select is(pg_temp.sql_state_msg(format($q$select place_order(%L, null, '[{"product_id":"%s","quantity":5}]')$q$,
  (select store from ids), (select p2 from ids))), 'insufficient_stock', 'stock insuffisant');
select is(pg_temp.sql_state_msg(format($q$select place_order(%L, null, '[{"product_id":"%s","quantity":1}]')$q$,
  (select store from ids), (select p3 from ids))), 'insufficient_stock', 'produit masqué refusé');
select is((select count(*) from orders)::int, 0, 'aucune commande écrite');

-- Commande valide, doublons regroupés (10 + 2 = 12)
reset role;
create temp table before as select
  coalesce((select last_value from order_counters where year = extract(year from now() at time zone 'Europe/Paris')), 0) as seq,
  (select count(*) from orders where status <> 'cancelled' and created_at >= date_trunc('month', now())) as month_orders;
grant select on before to authenticated;

select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
create temp table placed as select * from place_order((select store from ids), '  Livraison avant samedi  ',
  format('[{"product_id":"%s","quantity":10},{"product_id":"%s","quantity":2},{"product_id":"%s","quantity":4}]',
         (select p1 from ids), (select p1 from ids), (select p2 from ids))::jsonb);
select is((select number from placed),
  format('CMD-%s-%s', extract(year from now() at time zone 'Europe/Paris'), lpad(((select seq from before) + 1)::text, 4, '0')),
  'numéro CMD-AAAA-NNNN incrémenté');
select is((select total_ht from placed), 12 * 38.50 + 4 * 7.20, 'total');
select is((select units from placed), 16, 'unités');
select is((select message from placed), 'Livraison avant samedi', 'message nettoyé');
select is((select count(*) from order_items where order_id = (select id from placed))::int, 2, 'lignes regroupées');

reset role;
select is((select stock from products where reference = 'T-AN-100'), 118, 'stock décrémenté');
select is((select stock from products where reference = 'T-CM-075'), 0, 'stock à zéro');
select is((select count(*) from admin_notifications where type = 'new_order' and ref_id = (select id from placed))::int, 1,
  'notification de commande');

-- Le client ne peut pas changer un statut
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select is(pg_temp.sql_state_msg(format($q$select set_order_status(%L, 'done')$q$, (select id from placed))), 'forbidden',
  'client ne change pas le statut');
-- Un autre client ne voit pas la commande
select pg_temp.login('00000000-0000-0000-0000-0000000000c2');
select is((select count(*) from orders)::int, 0, 'commande invisible pour un autre client');

-- Annulation : stock restitué, statut final
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select set_order_status((select id from placed), 'preparing');
select set_order_status((select id from placed), 'cancelled');
select is((select stock from products where reference = 'T-AN-100'), 130, 'stock restitué (1)');
select is((select stock from products where reference = 'T-CM-075'), 4, 'stock restitué (2)');
select is((select count(*) from order_events where order_id = (select id from placed) and type = 'stock_restored')::int, 1,
  'événement stock_restored');
select is(pg_temp.sql_state_msg(format($q$select set_order_status(%L, 'done')$q$, (select id from placed))),
  'order_cancelled_is_final', 'annulée = statut final');

-- Statistiques : annulée exclue, séries complètes
select is((admin_stats('month') -> 'current' ->> 'orders')::int, (select month_orders from before)::int, 'annulées exclues');
select is(jsonb_array_length(admin_stats('week') -> 'series'), 7, '7 jours');
select is(jsonb_array_length(admin_stats('year') -> 'series'), 12, '12 mois');

-- Webhooks e-mail : une URL invalide ne bloque jamais le changement de statut ; app_settings illisible côté client
reset role;
update app_settings set value = '::pas-une-url' where key = 'notify_url';
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select lives_ok(format($q$select set_company_status(%L, 'suspended')$q$, (select id from companies where siret = '11111111111119')),
  'e-mail raté : le statut change quand même');
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok($q$select * from app_settings$q$, '42501', null, 'app_settings illisible pour un client');

-- Catalogue : recherche sans accents ni casse, par marque, filtres, produit masqué exclu
reset role;
insert into brands (name) values ('Maison Évasion Test');
update products set brand_id = (select id from brands where name = 'Maison Évasion Test'), title = 'Crème Hydratée Test'
  where reference = 'T-CM-075';
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select set_company_status((select id from companies where siret = '11111111111119'), 'active');
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select is((select count(*) from catalog_products('CREME hydratee'))::int, 1, 'recherche titre sans accents ni casse');
select is((select count(*) from catalog_products('evasion'))::int, 1, 'recherche par marque');
select is((select count(*) from catalog_products('T-AN-100'))::int, 1, 'recherche par référence');
select is((select count(*) from catalog_products('9990000000011'))::int, 1, 'recherche par EAN');
select is((select count(*) from catalog_products('T-HIDDEN'))::int, 0, 'produit masqué introuvable');
select is((select count(*) from catalog_products('test', null, null, true))::int, 2, 'disponibles : stock > 0');
select is((select count(*) from catalog_products('100%'))::int, 0, '% traité littéralement');

-- Suppression produit : refusée s'il est commandé, photos réordonnées en une instruction
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select is(pg_temp.sql_state_msg(format($q$delete from products where id = %L$q$, (select p1 from ids))), 'product_in_order', 'produit commandé : suppression refusée');
select is(pg_temp.sql_state_msg(format($q$delete from products where id = %L$q$, (select p3 from ids))), 'ok', 'produit jamais commandé : suppression possible');

-- Photos : réordonnancement atomique malgré la contrainte unique (product_id, position)
reset role;
insert into product_images (id, product_id, path, position) values
  ('00000000-0000-0000-0000-0000000000f1', (select p2 from ids), 'a.jpg', 0),
  ('00000000-0000-0000-0000-0000000000f2', (select p2 from ids), 'b.jpg', 1);
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select lives_ok(format($q$select reorder_product_images(%L, array['00000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-0000000000f1']::uuid[])$q$, (select p2 from ids)), 'réordonnancement sans violation');
select is((select path from product_images where product_id = (select p2 from ids) order by position limit 1), 'b.jpg', 'nouvel ordre appliqué');

-- Magasins : archivés s'ils ont des commandes, supprimés sinon, le dernier reste
reset role;
update companies set status = 'active' where siret = '11111111111119';
insert into stores (id, company_id, name, address, postal_code, city) values
  ('00000000-0000-0000-0000-0000000000e1', (select id from companies where siret = '11111111111119'), 'Annexe', '2 rue Test', '75002', 'Paris'),
  ('00000000-0000-0000-0000-0000000000e2', (select id from companies where siret = '11111111111119'), 'Dépôt', '3 rue Test', '75003', 'Paris');
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select is(remove_store('00000000-0000-0000-0000-0000000000e1'), 'deleted', 'magasin sans commande : supprimé');
select is(remove_store((select store from ids)), 'archived', 'magasin avec commande : archivé');
select is((select count(*) from stores where archived_at is null)::int, 1, 'le magasin archivé sort des listes');
select is(pg_temp.sql_state_msg($q$select remove_store('00000000-0000-0000-0000-0000000000e2')$q$), 'last_store', 'le dernier magasin reste');
select pg_temp.login('00000000-0000-0000-0000-0000000000c2');
select is(pg_temp.sql_state_msg($q$select remove_store('00000000-0000-0000-0000-0000000000e2')$q$), 'not_found', 'magasin d''un autre client introuvable');

-- Liste des clients : réservée à l'admin (la RLS vide le résultat pour un client)
select is((select count(*) from admin_clients('test wilson'))::int, 0, 'client : liste vide');
select pg_temp.login('00000000-0000-0000-0000-0000000000a1');
select is((select count(*) from admin_clients('TEST wilson'))::int, 1, 'admin : recherche raison sociale sans casse');
select is((select count(*) from admin_clients('111 111 111 11119'))::int, 1, 'admin : recherche SIRET avec espaces');
select is((select orders from admin_clients('test wilson')), 0, 'commandes annulées exclues du compteur');

-- Garde entreprise : un client ne change pas son statut, le service_role le peut (delete-account)
select pg_temp.login('00000000-0000-0000-0000-0000000000c1');
select throws_ok($q$update companies set status = 'deleted'$q$, 'P0001', 'forbidden_field', 'client : statut protégé');
reset role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select lives_ok($q$update companies set status = 'deleted', phone = null where siret = '11111111111119'$q$, 'service_role : statut modifiable');

-- Fonctions fermées à anon
reset role;
set local role anon;
select is(pg_temp.sql_state_msg($q$select place_order(gen_random_uuid(), null, '[]')$q$), 'permission denied for function place_order',
  'anon ne peut pas appeler place_order');

reset role;
select * from finish();
rollback;
