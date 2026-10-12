-- Auto-test des règles métier de schema.sql (stock, numérotation, annulation, inscription, stats).
-- À reprendre en test pgTAP dans supabase/tests/ au lot 0. Échoue au premier assert faux.
begin;

insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', 'admin@emd.test'),
  ('00000000-0000-0000-0000-00000000000c', 'contact@parfumerie-wilson.fr');
insert into profiles (id, role, first_name, last_name, email)
  values ('00000000-0000-0000-0000-00000000000a', 'admin', 'Admin', 'EMD', 'admin@emd.test');

-- Inscription du client
select set_config('test.uid', '00000000-0000-0000-0000-00000000000c', true);
select register_company('90963966800013', 'Parfumerie Wilson SAS', '113 av. du Président Wilson', '75116', 'Paris', 'Camille', 'Martin', null);
do $$ begin
  assert (select status from companies) = 'pending', 'entreprise en attente';
  assert (select count(*) from stores) = 1, 'premier magasin créé';
  assert (select count(*) from admin_notifications where type = 'signup_request') = 1, 'notif inscription';
end $$;

insert into products (reference, ean, title, price_ht, stock) values
  ('ML-AN-100', '3760123456789', 'Ambre Nocturne, Eau de Parfum 100 ml', 38.50, 130),
  ('BP-CMI-075', '3760123456802', 'Crème Mains Iris 75 ml', 7.20, 4);

-- Commande refusée tant que le compte n'est pas validé
do $$ begin
  perform place_order((select id from stores), null, '[]');
  raise exception 'aurait dû échouer';
exception when others then assert sqlerrm = 'company_not_active', sqlerrm; end $$;

-- Validation par l'admin
select set_config('test.uid', '00000000-0000-0000-0000-00000000000a', true);
select set_company_status((select id from companies), 'active');
select set_config('test.uid', '00000000-0000-0000-0000-00000000000c', true);

-- Stock insuffisant : rien n'est écrit
do $$ begin
  perform place_order((select id from stores), null,
    jsonb_build_array(jsonb_build_object('product_id', (select id from products where reference = 'BP-CMI-075'), 'quantity', 5)));
  raise exception 'aurait dû échouer';
exception when others then assert sqlerrm = 'insufficient_stock', sqlerrm; end $$;
do $$ begin assert (select count(*) from orders) = 0, 'aucune commande'; end $$;

-- Commande valide (doublon regroupé : 10 + 2 = 12)
select place_order((select id from stores), '  Livraison avant samedi  ', jsonb_build_array(
  jsonb_build_object('product_id', (select id from products where reference = 'ML-AN-100'), 'quantity', 10),
  jsonb_build_object('product_id', (select id from products where reference = 'ML-AN-100'), 'quantity', 2),
  jsonb_build_object('product_id', (select id from products where reference = 'BP-CMI-075'), 'quantity', 4)));
do $$ begin
  assert (select number from orders) = 'CMD-' || extract(year from now() at time zone 'Europe/Paris') || '-0001', 'numéro';
  assert (select total_ht from orders) = 12 * 38.50 + 4 * 7.20, 'total';
  assert (select units from orders) = 16, 'unités';
  assert (select message from orders) = 'Livraison avant samedi', 'message nettoyé';
  assert (select stock from products where reference = 'ML-AN-100') = 118, 'stock décrémenté';
  assert (select stock from products where reference = 'BP-CMI-075') = 0, 'rupture';
  assert (select count(*) from order_items) = 2, 'lignes regroupées';
end $$;

-- Le client ne peut pas changer un statut
do $$ begin
  perform set_order_status((select id from orders), 'done');
  raise exception 'aurait dû échouer';
exception when others then assert sqlerrm = 'forbidden', sqlerrm; end $$;

-- Annulation par l'admin : stock restitué, statut final
select set_config('test.uid', '00000000-0000-0000-0000-00000000000a', true);
select set_order_status((select id from orders), 'preparing');
select set_order_status((select id from orders), 'cancelled');
do $$ begin
  assert (select stock from products where reference = 'ML-AN-100') = 130, 'stock restitué';
  assert (select stock from products where reference = 'BP-CMI-075') = 4, 'stock restitué';
  assert (select count(*) from order_events where type = 'stock_restored') = 1, 'événement';
end $$;
do $$ begin
  perform set_order_status((select id from orders), 'done');
  raise exception 'aurait dû échouer';
exception when others then assert sqlerrm = 'order_cancelled_is_final', sqlerrm; end $$;

-- Statistiques : la commande annulée est exclue
do $$ begin
  assert (admin_stats('month') -> 'current' ->> 'orders')::int = 0, 'annulées exclues';
  assert jsonb_array_length(admin_stats('week') -> 'series') = 7, '7 jours';
  assert jsonb_array_length(admin_stats('year') -> 'series') = 12, '12 mois';
end $$;

select 'TOUS LES TESTS PASSENT' as resultat;
rollback;
