-- EMD DESTOCK : modèle de données de référence (Supabase / Postgres 15+)
-- À découper en migrations dans supabase/migrations/ au lot 0.
-- Les règles métier sensibles (stock, numérotation, statuts) vivent ici, pas dans les apps.

create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- unaccent n'est pas immutable : enveloppe nécessaire pour la colonne générée "search".
create or replace function unaccent_immutable(text) returns text
language sql immutable parallel safe as $$ select public.unaccent('public.unaccent', $1) $$;

-- ---------------------------------------------------------------- Types
create type user_role as enum ('client', 'admin');
create type company_status as enum ('pending', 'active', 'refused', 'suspended', 'deleted');
create type order_status as enum ('received', 'preparing', 'done', 'cancelled');
create type banner_theme as enum ('encre', 'pierre', 'blanc');
create type banner_target as enum ('product', 'category', 'brand', 'selection');
create type banner_audience as enum ('new', 'all');
create type placeholder_shape as enum ('tall', 'round', 'tube');

-- ---------------------------------------------------------------- Tables
create table companies (
  id uuid primary key default gen_random_uuid(),
  siret char(14) not null unique check (siret ~ '^[0-9]{14}$'),
  legal_name text not null,
  address text not null,
  postal_code text not null,
  city text not null,
  phone text,
  status company_status not null default 'pending',
  is_former_client boolean not null default false, -- V2 : tarifs préférentiels, sans effet en V1
  validated_at timestamptz,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'client',
  company_id uuid references companies on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  check (role = 'admin' or company_id is not null)
);

create table stores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies on delete cascade,
  name text not null,
  address text not null,
  postal_code text not null,
  city text not null,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references categories on delete restrict,
  position int not null default 0,
  unique (parent_id, name)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  ean char(13) not null unique check (ean ~ '^[0-9]{13}$'),
  title text not null,
  brand_id uuid references brands on delete set null,
  category_id uuid references categories on delete set null,
  description text,                                         -- courte
  body text check (char_length(body) <= 1000),              -- texte produit
  price_ht numeric(10,2) not null check (price_ht >= 0),
  weight_kg numeric(7,3) check (weight_kg >= 0),
  stock int not null default 0 check (stock >= 0),
  is_visible boolean not null default true,
  placeholder_shape placeholder_shape not null default 'tall', -- visuel tant qu'il n'y a pas de photo
  search text generated always as (
    lower(unaccent_immutable(coalesce(title, '') || ' ' || reference || ' ' || ean))
  ) stored, -- la marque se cherche par jointure sur brands.name
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  path text not null,        -- chemin dans le bucket "product-images"
  thumb_path text,           -- vignette 400 px
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, position) deferrable initially deferred
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,                  -- CMD-AAAA-NNNN
  company_id uuid not null references companies on delete restrict,
  store_id uuid not null references stores on delete restrict,
  created_by uuid references profiles on delete set null,
  status order_status not null default 'received',
  message text check (char_length(message) <= 1000),
  total_ht numeric(12,2) not null,
  units int not null,
  viewed_at timestamptz,                        -- consultée par l'admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  product_id uuid references products on delete set null,
  reference text not null,                      -- valeurs figées au moment de la commande
  title text not null,
  ean char(13) not null,
  unit_price_ht numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total_ht numeric(12,2) not null
);

create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  type text not null,                           -- created, status_changed, stock_restored
  payload jsonb not null default '{}',
  created_by uuid references profiles on delete set null,
  created_at timestamptz not null default now()
);

create table order_counters (
  year int primary key,
  last_value int not null
);

create table banners (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null check (char_length(eyebrow) <= 40),
  title text not null check (char_length(title) <= 60),
  cta_label text not null check (char_length(cta_label) <= 24),
  theme banner_theme not null default 'encre',
  image_path text,                              -- remplace le fond uni si renseigné
  target_type banner_target not null,
  target_id uuid,                               -- produit, catégorie ou marque ; nul pour une sélection
  audience banner_audience not null default 'all',
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table banner_products (
  banner_id uuid not null references banners on delete cascade,
  product_id uuid not null references products on delete cascade,
  primary key (banner_id, product_id)
);

create table admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,                           -- new_order, signup_request
  ref_id uuid not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- Index
create index on products using gin (search gin_trgm_ops);
create index on products (brand_id);
create index on products (category_id);
create index on products (created_at desc);
create index on orders (company_id, created_at desc);
create index on orders (status, created_at desc);
create index on order_items (order_id);
create index on order_items (product_id);
create index on stores (company_id);
create index on banners (starts_at, ends_at);

-- ---------------------------------------------------------------- Fonctions utilitaires
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function my_company_id() returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from profiles where id = auth.uid()
$$;

create or replace function my_company_is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from companies c join profiles p on p.company_id = c.id
                 where p.id = auth.uid() and c.status = 'active')
$$;

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_touch before update on products for each row execute function touch_updated_at();
create trigger orders_touch before update on orders for each row execute function touch_updated_at();

-- ---------------------------------------------------------------- Inscription
-- Appelée par l'app juste après supabase.auth.signUp (SIRET déjà vérifié par l'Edge Function verify-siret).
create or replace function register_company(
  p_siret text, p_legal_name text, p_address text, p_postal_code text, p_city text,
  p_first_name text, p_last_name text, p_phone text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_company uuid; v_email text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from profiles where id = auth.uid()) then raise exception 'already_registered'; end if;
  select email into v_email from auth.users where id = auth.uid();

  insert into companies (siret, legal_name, address, postal_code, city, phone)
  values (p_siret, p_legal_name, p_address, p_postal_code, p_city, p_phone)
  returning id into v_company;  -- unique_violation sur siret → "Ce SIRET est déjà inscrit"

  insert into profiles (id, role, company_id, first_name, last_name, email, phone)
  values (auth.uid(), 'client', v_company, p_first_name, p_last_name, v_email, p_phone);

  insert into stores (company_id, name, address, postal_code, city)
  values (v_company, p_legal_name, p_address, p_postal_code, p_city);

  insert into admin_notifications (type, ref_id, title, body)
  values ('signup_request', v_company, 'Demande d''inscription', p_legal_name);
  return v_company;
end $$;

create or replace function set_company_status(p_company uuid, p_status company_status) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  if p_status = 'deleted' then raise exception 'use_delete_account'; end if;
  update companies
     set status = p_status,
         validated_at = case when p_status = 'active' and validated_at is null then now() else validated_at end
   where id = p_company;
  -- L'e-mail au client est envoyé par l'Edge Function "notify" (webhook sur companies.status).
end $$;

-- ---------------------------------------------------------------- Commande
-- p_items : [{"product_id": "...", "quantity": 12}, ...]
create or replace function place_order(p_store uuid, p_message text, p_items jsonb) returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := my_company_id();
  v_order orders;
  v_year int := extract(year from now() at time zone 'Europe/Paris');
  v_seq int;
  v_missing jsonb;
begin
  if not my_company_is_active() then raise exception 'company_not_active'; end if;
  if not exists (select 1 from stores where id = p_store and company_id = v_company and archived_at is null) then
    raise exception 'invalid_store';
  end if;
  if jsonb_array_length(coalesce(p_items, '[]')) = 0 then raise exception 'empty_order'; end if;

  -- Regroupe les doublons, puis verrouille les produits dans un ordre stable (évite les interblocages).
  create temp table _lines on commit drop as
    select (i->>'product_id')::uuid as product_id, sum((i->>'quantity')::int) as quantity
    from jsonb_array_elements(p_items) i group by 1;
  if exists (select 1 from _lines where quantity <= 0) then raise exception 'invalid_quantity'; end if;
  perform 1 from products where id in (select product_id from _lines) order by id for update;

  select jsonb_agg(jsonb_build_object('product_id', l.product_id, 'requested', l.quantity,
                                      'available', coalesce(case when p.is_visible then p.stock end, 0)))
    into v_missing
    from _lines l left join products p on p.id = l.product_id
   where p.id is null or not p.is_visible or p.stock < l.quantity;
  if v_missing is not null then
    raise exception 'insufficient_stock' using detail = v_missing::text;
  end if;

  insert into order_counters (year, last_value) values (v_year, 1)
    on conflict (year) do update set last_value = order_counters.last_value + 1
    returning last_value into v_seq;

  insert into orders (number, company_id, store_id, created_by, message, total_ht, units)
  select format('CMD-%s-%s', v_year, lpad(v_seq::text, 4, '0')), v_company, p_store, auth.uid(),
         nullif(trim(p_message), ''), sum(l.quantity * p.price_ht), sum(l.quantity)
    from _lines l join products p on p.id = l.product_id
  returning * into v_order;

  insert into order_items (order_id, product_id, reference, title, ean, unit_price_ht, quantity, line_total_ht)
  select v_order.id, p.id, p.reference, p.title, p.ean, p.price_ht, l.quantity, l.quantity * p.price_ht
    from _lines l join products p on p.id = l.product_id;

  update products p set stock = p.stock - l.quantity from _lines l where p.id = l.product_id;

  insert into order_events (order_id, type, payload, created_by)
  values (v_order.id, 'created', jsonb_build_object('units', v_order.units), auth.uid());
  insert into admin_notifications (type, ref_id, title, body)
  select 'new_order', v_order.id, 'Nouvelle commande ' || v_order.number,
         s.name || ' · ' || v_order.units || ' unités' from stores s where s.id = p_store;
  return v_order;
end $$;

create or replace function set_order_status(p_order uuid, p_status order_status) returns orders
language plpgsql security definer set search_path = public as $$
declare v_old order_status; v_order orders;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  select status into v_old from orders where id = p_order for update;
  if v_old is null then raise exception 'not_found'; end if;
  if v_old = p_status then select * into v_order from orders where id = p_order; return v_order; end if;
  if v_old = 'cancelled' then raise exception 'order_cancelled_is_final'; end if;

  if p_status = 'cancelled' then
    update products p set stock = p.stock + i.quantity
      from order_items i where i.order_id = p_order and i.product_id = p.id;
    insert into order_events (order_id, type, created_by) values (p_order, 'stock_restored', auth.uid());
  end if;

  update orders set status = p_status where id = p_order returning * into v_order;
  insert into order_events (order_id, type, payload, created_by)
  values (p_order, 'status_changed', jsonb_build_object('from', v_old, 'to', p_status), auth.uid());
  return v_order;
end $$;

-- ---------------------------------------------------------------- Statistiques admin
-- p_period : 'week' | 'month' | 'year'. Commandes annulées exclues.
create or replace function admin_stats(p_period text, p_ref date default current_date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_unit text := case p_period when 'week' then 'week' when 'month' then 'month' else 'year' end;
  v_from timestamptz := date_trunc(v_unit, p_ref::timestamptz);
  v_to timestamptz := v_from + ('1 ' || v_unit)::interval;
  v_prev timestamptz := v_from - ('1 ' || v_unit)::interval;
  v_bucket text := case p_period when 'week' then 'day' when 'month' then 'week' else 'month' end;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'current', (select jsonb_build_object('orders', count(*), 'units', coalesce(sum(units), 0),
                       'total_ht', coalesce(sum(total_ht), 0), 'active_clients', count(distinct company_id))
                  from orders where status <> 'cancelled' and created_at >= v_from and created_at < v_to),
    'previous', (select jsonb_build_object('orders', count(*), 'units', coalesce(sum(units), 0),
                        'total_ht', coalesce(sum(total_ht), 0), 'active_clients', count(distinct company_id))
                   from orders where status <> 'cancelled' and created_at >= v_prev and created_at < v_from),
    'series', (select coalesce(jsonb_agg(jsonb_build_object('bucket', b, 'orders', n) order by b), '[]')
                 from (select gs as b, (select count(*) from orders o
                                          where o.status <> 'cancelled' and o.created_at >= gs
                                            and o.created_at < gs + ('1 ' || v_bucket)::interval) as n
                         from generate_series(v_from, v_to - interval '1 second', ('1 ' || v_bucket)::interval) gs) s),
    'top_products', (select coalesce(jsonb_agg(t), '[]') from (
                       select i.product_id, i.title, i.reference, sum(i.quantity) as units
                         from order_items i join orders o on o.id = i.order_id
                        where o.status <> 'cancelled' and o.created_at >= v_from and o.created_at < v_to
                        group by 1, 2, 3 order by units desc limit 5) t),
    'top_stores', (select coalesce(jsonb_agg(t), '[]') from (
                     select s.id, s.name, c.legal_name, count(*) as orders, sum(o.total_ht) as total_ht
                       from orders o join stores s on s.id = o.store_id join companies c on c.id = o.company_id
                      where o.status <> 'cancelled' and o.created_at >= v_from and o.created_at < v_to
                      group by 1, 2, 3 order by total_ht desc limit 5) t)
  );
end $$;

-- ---------------------------------------------------------------- Encarts visibles pour le client connecté
create or replace function my_banners() returns setof banners
language sql stable security definer set search_path = public as $$
  select b.* from banners b
   where my_company_is_active()
     and now() >= b.starts_at and now() < b.ends_at
     and (b.audience = 'all'
          or not exists (select 1 from orders o where o.company_id = my_company_id() and o.status <> 'cancelled'))
   order by b.position
   limit 5
$$;

-- ---------------------------------------------------------------- RLS
alter table companies enable row level security;
alter table profiles enable row level security;
alter table stores enable row level security;
alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_events enable row level security;
alter table order_counters enable row level security;
alter table banners enable row level security;
alter table banner_products enable row level security;
alter table admin_notifications enable row level security;

-- Admin : accès complet en lecture/écriture (les changements de stock et de statut passent par les fonctions).
create policy admin_all on companies for all using (is_admin()) with check (is_admin());
create policy admin_all on profiles for all using (is_admin()) with check (is_admin());
create policy admin_all on stores for all using (is_admin()) with check (is_admin());
create policy admin_all on brands for all using (is_admin()) with check (is_admin());
create policy admin_all on categories for all using (is_admin()) with check (is_admin());
create policy admin_all on products for all using (is_admin()) with check (is_admin());
create policy admin_all on product_images for all using (is_admin()) with check (is_admin());
create policy admin_read on orders for select using (is_admin());
create policy admin_mark_viewed on orders for update using (is_admin()) with check (is_admin());
create policy admin_read on order_items for select using (is_admin());
create policy admin_read on order_events for select using (is_admin());
create policy admin_all on banners for all using (is_admin()) with check (is_admin());
create policy admin_all on banner_products for all using (is_admin()) with check (is_admin());
create policy admin_all on admin_notifications for all using (is_admin()) with check (is_admin());

-- Client : son profil, son entreprise, ses magasins (même en attente, pour l'écran EnAttente).
create policy own_profile_read on profiles for select using (id = auth.uid());
create policy own_profile_update on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = 'client' and company_id = my_company_id());
create policy own_company_read on companies for select using (id = my_company_id());
create policy own_company_update on companies for update using (id = my_company_id() and my_company_is_active())
  with check (id = my_company_id() and status = 'active');
create or replace function guard_company_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and (new.siret <> old.siret or new.status <> old.status
     or new.is_former_client <> old.is_former_client or new.validated_at is distinct from old.validated_at) then
    raise exception 'forbidden_field';
  end if;
  return new;
end $$;
create trigger companies_guard before update on companies for each row execute function guard_company_update();
create policy own_stores_read on stores for select using (company_id = my_company_id());
create policy own_stores_write on stores for insert with check (company_id = my_company_id() and my_company_is_active());
create policy own_stores_update on stores for update using (company_id = my_company_id() and my_company_is_active())
  with check (company_id = my_company_id());

-- Client actif : catalogue visible.
create policy client_catalog on products for select using (is_visible and my_company_is_active());
create policy client_images on product_images for select
  using (my_company_is_active() and exists (select 1 from products p where p.id = product_id and p.is_visible));
create policy client_brands on brands for select using (my_company_is_active());
create policy client_categories on categories for select using (my_company_is_active());
create policy client_banner_products on banner_products for select using (my_company_is_active());

-- Client : ses commandes en lecture seule (création via place_order).
create policy own_orders on orders for select using (company_id = my_company_id());
create policy own_order_items on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and o.company_id = my_company_id()));

-- Fonctions : exécution réservée aux utilisateurs connectés.
revoke execute on all functions in schema public from anon;
