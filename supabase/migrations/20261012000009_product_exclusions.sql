-- Visibilité par client (devis §4.1) : en plus de l'interrupteur global, l'admin masque un produit pour certains clients.
create table product_exclusions (
  product_id uuid not null references products(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  primary key (product_id, company_id)
);
create index on product_exclusions (company_id);
alter table product_exclusions enable row level security;
create policy admin_all on product_exclusions for all using (is_admin()) with check (is_admin());

-- Prédicat de RLS : security definer (le client ne lit pas la table), exécutable par anon comme is_admin()
-- (sinon 42501 pour tout abonné anonyme) ; renvoie false sans session.
create or replace function product_hidden_for_me(p_product uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from product_exclusions where product_id = p_product and company_id = my_company_id())
$$;
grant execute on function product_hidden_for_me(uuid) to public, anon, authenticated, service_role;

-- Remplace la liste des clients exclus d'un produit.
create or replace function set_product_exclusions(p_product uuid, p_companies uuid[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  delete from product_exclusions where product_id = p_product;
  insert into product_exclusions (product_id, company_id)
    select p_product, c from unnest(coalesce(p_companies, '{}')) c on conflict do nothing;
end $$;
revoke execute on function set_product_exclusions(uuid, uuid[]) from public, anon;
grant execute on function set_product_exclusions(uuid, uuid[]) to authenticated, service_role;

drop policy client_catalog on products;
create policy client_catalog on products for select
  using (is_visible and my_company_is_active() and not product_hidden_for_me(id));
drop policy client_images on product_images;
create policy client_images on product_images for select
  using (my_company_is_active() and exists (select 1 from products p
         where p.id = product_id and p.is_visible and not product_hidden_for_me(p.id)));

create or replace function top_ordered_products(p_limit int default 8)
returns table (product_id uuid, units bigint)
language sql stable security definer set search_path = public as $$
  select i.product_id, sum(i.quantity)::bigint as units
    from order_items i
    join orders o on o.id = i.order_id and o.status <> 'cancelled'
    join products p on p.id = i.product_id and p.is_visible and not product_hidden_for_me(p.id)
   where my_company_is_active()
   group by i.product_id
   order by units desc, i.product_id
   limit least(greatest(p_limit, 1), 20)
$$;

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
  drop table if exists _lines; -- plusieurs appels dans une même transaction
  create temp table _lines on commit drop as
    select (i->>'product_id')::uuid as product_id, sum((i->>'quantity')::int) as quantity
    from jsonb_array_elements(p_items) i group by 1;
  if exists (select 1 from _lines where quantity <= 0) then raise exception 'invalid_quantity'; end if;
  perform 1 from products where id in (select product_id from _lines) order by id for update;

  select jsonb_agg(jsonb_build_object('product_id', l.product_id, 'requested', l.quantity,
                                      'available', coalesce(case when p.is_visible and not product_hidden_for_me(p.id) then p.stock end, 0)))
    into v_missing
    from _lines l left join products p on p.id = l.product_id
   where p.id is null or not p.is_visible or product_hidden_for_me(p.id) or p.stock < l.quantity;
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
