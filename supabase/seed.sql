-- Données de démonstration (SPEC §4). Environnement local uniquement : ne jamais exécuter en production.
-- Comptes de démo : voir DEMO_* dans .env.example.

create function pg_temp.mk_user(p_id uuid, p_email text, p_password text) returns void
language sql as $$
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (p_id::text, p_id, jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now());
$$;

-- Admin
select pg_temp.mk_user('00000000-0000-0000-0000-00000000000a', 'admin@emd-destock.test', 'AdminDemo2026!');
insert into profiles (id, role, first_name, last_name, email)
values ('00000000-0000-0000-0000-00000000000a', 'admin', 'Admin', 'EMD', 'admin@emd-destock.test');

-- Marques, catégories
insert into brands (id, name) values
  ('b0000000-0000-0000-0000-000000000001', 'Maison Lior'),
  ('b0000000-0000-0000-0000-000000000002', 'Atelier Sorel'),
  ('b0000000-0000-0000-0000-000000000003', 'Botanica Paris');
insert into categories (id, name, position) values
  ('c0000000-0000-0000-0000-000000000001', 'Parfums', 1),
  ('c0000000-0000-0000-0000-000000000002', 'Soins', 2),
  ('c0000000-0000-0000-0000-000000000003', 'Maquillage', 3),
  ('c0000000-0000-0000-0000-000000000004', 'Coffrets', 4);

-- Produits (created_at décalé pour un tri « nouveautés » stable)
insert into products (reference, ean, title, brand_id, category_id, description, price_ht, stock, is_visible, placeholder_shape, created_at)
select r, e, t, b, c, d, p, s, v, sh::placeholder_shape, now() - (n || ' hours')::interval
from (values
  (1,  'ML-AN-100', '3760123456784', 'Ambre Nocturne, Eau de Parfum 100 ml', 'b0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Ambre, vanille et bois chauds.', 38.50, 130, true,  'tall'),
  (2,  'AS-VG-050', '3760123456791', 'Vétiver Gris, Eau de Toilette 50 ml', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Vétiver sec et poivre rose.', 29.90, 80, true, 'round'),
  (3,  'BP-CMI-075', '3760123456807', 'Crème Mains Iris 75 ml', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Crème mains à l''iris.', 7.20, 4, true, 'tube'),
  (4,  'AS-MB-030', '3760123456814', 'Musc Blanc, Eau de Parfum 30 ml', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Musc propre et coton.', 21.00, 0, true, 'round'),
  (5,  'ML-RP-075', '3760123456821', 'Rose Poudrée, Eau de Parfum 75 ml', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Rose poudrée et santal.', 34.00, 57, true, 'tall'),
  (6,  'BP-LCN-200', '3760123456838', 'Lait Corps Néroli 200 ml', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Lait hydratant au néroli.', 9.80, 210, true, 'tube'),
  (7,  'ML-OF-100', '3760123456845', 'Oud Fumé, Eau de Parfum 100 ml', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Oud fumé et cuir.', 44.00, 18, false, 'tall'),
  (8,  'BP-GDF-250', '3760123456852', 'Gel Douche Figue 250 ml', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Gel douche à la figue.', 5.40, 0, false, 'tube'),
  (9,  'AS-CB-100', '3760123456869', 'Cèdre Blanc, Eau de Toilette 100 ml', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Cèdre blanc et musc.', 31.50, 3, true, 'round'),
  (10, 'BP-BLV-015', '3760123456876', 'Baume Lèvres Verveine 15 ml', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Baume nourrissant à la verveine.', 3.90, 412, true, 'tube')
) as x(n, r, e, t, b, c, d, p, s, v, sh);

-- Clients
select pg_temp.mk_user('00000000-0000-0000-0000-00000000000c', 'demo-client@emd-destock.test', 'ClientDemo2026!');
select pg_temp.mk_user('00000000-0000-0000-0000-0000000000d1', 'contact@beaute-rivoli.test', 'ClientDemo2026!');
select pg_temp.mk_user('00000000-0000-0000-0000-0000000000d2', 'contact@senteurs-marais.test', 'ClientDemo2026!');
select pg_temp.mk_user('00000000-0000-0000-0000-0000000000e1', 's.cohen@beaute-montmartre.test', 'ClientDemo2026!');
select pg_temp.mk_user('00000000-0000-0000-0000-0000000000e2', 'contact@parfumsandco.test', 'ClientDemo2026!');
select pg_temp.mk_user('00000000-0000-0000-0000-0000000000e3', 'emma@atelier-beaute.test', 'ClientDemo2026!');

insert into companies (id, siret, legal_name, address, postal_code, city, status, validated_at, created_at) values
  ('a0000000-0000-0000-0000-000000000001', '90963966800013', 'Parfumerie Wilson SAS', '113 avenue du Président Wilson', '75116', 'Paris', 'active', now() - interval '120 days', now() - interval '121 days'),
  ('a0000000-0000-0000-0000-000000000002', '81234567800021', 'Beauté Rivoli SARL', '12 rue de Rivoli', '75001', 'Paris', 'active', now() - interval '90 days', now() - interval '91 days'),
  ('a0000000-0000-0000-0000-000000000003', '85234567800033', 'Senteurs du Marais', '8 rue des Francs-Bourgeois', '75004', 'Paris', 'active', now() - interval '60 days', now() - interval '61 days'),
  ('a0000000-0000-0000-0000-000000000011', '91864022500014', 'Beauté Montmartre SAS', '5 rue des Abbesses', '75018', 'Paris', 'pending', null, now() - interval '1 hour'),
  ('a0000000-0000-0000-0000-000000000012', '88432701900026', 'Parfums & Co Nantes', '14 rue Crébillon', '44000', 'Nantes', 'pending', null, now() - interval '3 hours'),
  ('a0000000-0000-0000-0000-000000000013', '90275148600018', 'L''Atelier Beauté Lyon', '22 rue de la République', '69002', 'Lyon', 'pending', null, now() - interval '1 day');

insert into profiles (id, company_id, first_name, last_name, email, phone) values
  ('00000000-0000-0000-0000-00000000000c', 'a0000000-0000-0000-0000-000000000001', 'Camille', 'Martin', 'demo-client@emd-destock.test', '0140000001'),
  ('00000000-0000-0000-0000-0000000000d1', 'a0000000-0000-0000-0000-000000000002', 'Léa', 'Bernard', 'contact@beaute-rivoli.test', null),
  ('00000000-0000-0000-0000-0000000000d2', 'a0000000-0000-0000-0000-000000000003', 'Hugo', 'Leroy', 'contact@senteurs-marais.test', null),
  ('00000000-0000-0000-0000-0000000000e1', 'a0000000-0000-0000-0000-000000000011', 'Sarah', 'Cohen', 's.cohen@beaute-montmartre.test', null),
  ('00000000-0000-0000-0000-0000000000e2', 'a0000000-0000-0000-0000-000000000012', 'Julien', 'Petit', 'contact@parfumsandco.test', null),
  ('00000000-0000-0000-0000-0000000000e3', 'a0000000-0000-0000-0000-000000000013', 'Emma', 'Rousseau', 'emma@atelier-beaute.test', null);

insert into stores (id, company_id, name, address, postal_code, city) values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Parfumerie Wilson', '113 avenue du Président Wilson', '75116', 'Paris'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Wilson Nord', '40 rue de Clignancourt', '75018', 'Paris'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Rivoli Opéra', '3 avenue de l''Opéra', '75001', 'Paris'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'Les Senteurs du Marais', '8 rue des Francs-Bourgeois', '75004', 'Paris'),
  ('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000011', 'Beauté Montmartre SAS', '5 rue des Abbesses', '75018', 'Paris'),
  ('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000012', 'Parfums & Co Nantes', '14 rue Crébillon', '44000', 'Nantes'),
  ('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000013', 'L''Atelier Beauté Lyon', '22 rue de la République', '69002', 'Lyon');

insert into admin_notifications (type, ref_id, title, body, created_at) values
  ('signup_request', 'a0000000-0000-0000-0000-000000000011', 'Demande d''inscription', 'Beauté Montmartre SAS', now() - interval '1 hour'),
  ('signup_request', 'a0000000-0000-0000-0000-000000000012', 'Demande d''inscription', 'Parfums & Co Nantes', now() - interval '3 hours'),
  ('signup_request', 'a0000000-0000-0000-0000-000000000013', 'Demande d''inscription', 'L''Atelier Beauté Lyon', now() - interval '1 day');

-- Commandes : insérées directement (dates passées), prix et références figés comme place_order.
do $$
declare
  spec jsonb := '[
    {"n":143,"store":"d0000000-0000-0000-0000-000000000001","status":"received","days":1,"lines":{"ML-AN-100":12,"BP-LCN-200":24,"AS-VG-050":6}},
    {"n":142,"store":"d0000000-0000-0000-0000-000000000001","status":"preparing","days":4,"lines":{"ML-RP-075":20,"BP-CMI-075":30,"BP-BLV-015":36}},
    {"n":141,"store":"d0000000-0000-0000-0000-000000000003","status":"preparing","days":5,"lines":{"ML-AN-100":40,"AS-CB-100":10,"BP-LCN-200":80}},
    {"n":140,"store":"d0000000-0000-0000-0000-000000000004","status":"received","days":6,"lines":{"AS-VG-050":12,"BP-BLV-015":12}},
    {"n":138,"store":"d0000000-0000-0000-0000-000000000002","status":"done","days":13,"lines":{"ML-RP-075":12,"AS-VG-050":24}},
    {"n":136,"store":"d0000000-0000-0000-0000-000000000004","status":"done","days":15,"lines":{"BP-LCN-200":12,"BP-BLV-015":6}},
    {"n":131,"store":"d0000000-0000-0000-0000-000000000001","status":"cancelled","days":23,"lines":{"ML-AN-100":10}}
  ]';
  o jsonb; l record; v_id uuid; v_company uuid; v_total numeric; v_units int; v_created timestamptz;
begin
  foreach o in array (select array_agg(x) from jsonb_array_elements(spec) x) loop
    v_created := now() - ((o->>'days') || ' days')::interval;
    select company_id into v_company from stores where id = (o->>'store')::uuid;
    select sum(p.price_ht * q.value::int), sum(q.value::int) into v_total, v_units
      from jsonb_each_text(o->'lines') q join products p on p.reference = q.key;
    insert into orders (number, company_id, store_id, status, message, total_ht, units, viewed_at, created_at)
    values (format('CMD-2026-%s', lpad(o->>'n', 4, '0')), v_company, (o->>'store')::uuid, (o->>'status')::order_status,
            case when (o->>'n')::int = 143 then 'Livraison avant samedi si possible.' end,
            v_total, v_units, case when o->>'status' = 'received' and (o->>'n')::int = 143 then null else v_created + interval '1 hour' end,
            v_created)
    returning id into v_id;
    insert into order_items (order_id, product_id, reference, title, ean, unit_price_ht, quantity, line_total_ht)
    select v_id, p.id, p.reference, p.title, p.ean, p.price_ht, q.value::int, p.price_ht * q.value::int
      from jsonb_each_text(o->'lines') q join products p on p.reference = q.key;
    insert into order_events (order_id, type, payload, created_at)
    values (v_id, 'created', jsonb_build_object('units', v_units), v_created);
  end loop;
  insert into order_counters (year, last_value) values (2026, 143);
  insert into admin_notifications (type, ref_id, title, body, created_at)
  select 'new_order', id, 'Nouvelle commande ' || number, units || ' unités', created_at
    from orders where number = 'CMD-2026-0143';
end $$;

-- Encarts d'accueil
insert into banners (id, eyebrow, title, cta_label, theme, target_type, target_id, audience, starts_at, ends_at, position) values
  ('f0000000-0000-0000-0000-000000000001', 'Arrivage du 29 sept.', 'Maison Lior : 40 nouvelles références', 'Découvrir', 'encre', 'brand', 'b0000000-0000-0000-0000-000000000001', 'new', now() - interval '13 days', now() + interval '3 days', 1),
  ('f0000000-0000-0000-0000-000000000002', 'Déstockage', 'Jusqu''à −50 % sur une sélection de soins', 'Voir la sélection', 'pierre', 'selection', null, 'new', now() - interval '17 days', now() + interval '19 days', 2),
  ('f0000000-0000-0000-0000-000000000003', 'Nouveauté', 'Vétiver Gris arrive en format 50 ml', 'Voir le produit', 'blanc', 'product', (select id from products where reference = 'AS-VG-050'), 'all', now() - interval '11 days', now() + interval '8 days', 3),
  ('f0000000-0000-0000-0000-000000000004', 'Fêtes de fin d''année', 'Coffrets cadeaux : précommandes ouvertes', 'Découvrir', 'encre', 'category', 'c0000000-0000-0000-0000-000000000004', 'all', now() + interval '20 days', now() + interval '73 days', 4);
insert into banner_products (banner_id, product_id)
select 'f0000000-0000-0000-0000-000000000002', id from products where reference in ('BP-CMI-075', 'BP-LCN-200', 'BP-BLV-015');
