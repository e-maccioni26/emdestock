-- Lot 2 : recherche catalogue, suppression protégée, réordonnancement des photos.

-- Recherche titre / référence / EAN (colonne "search") + marque, insensible à la casse et aux accents.
-- security invoker : la RLS s'applique (le client ne voit que les produits visibles, l'admin voit tout).
-- Pas de limit/offset ici : le client pagine avec .range() et obtient le total avec count: 'exact'.
-- strpos plutôt que like : pas de caractères joker à échapper (index trigram non utilisé, suffisant à ~2 400 références).
create or replace function catalog_products(
  p_query text default null,
  p_categories uuid[] default null,
  p_brands uuid[] default null,
  p_available boolean default false
) returns setof products
language sql stable security invoker set search_path = public as $$
  with q as (select lower(unaccent_immutable(trim(coalesce(p_query, '')))) as t)
  select p.* from products p, q
   where (q.t = '' or strpos(p.search, q.t) > 0
          or exists (select 1 from brands b where b.id = p.brand_id and strpos(lower(unaccent_immutable(b.name)), q.t) > 0))
     and (coalesce(cardinality(p_categories), 0) = 0
          or p.category_id in (select c.id from categories c where c.id = any(p_categories) or c.parent_id = any(p_categories)))
     and (coalesce(cardinality(p_brands), 0) = 0 or p.brand_id = any(p_brands))
     and (not p_available or p.stock > 0)
$$;

-- Un produit présent dans une commande ne se supprime pas (SPEC §2) : on le masque.
create or replace function guard_product_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from order_items where product_id = old.id) then raise exception 'product_in_order'; end if;
  return old;
end $$;
create trigger products_guard_delete before delete on products for each row execute function guard_product_delete();

-- Réordonne les photos en une seule instruction (la contrainte unique (product_id, position) est différée).
create or replace function reorder_product_images(p_product uuid, p_ids uuid[]) returns void
language sql security invoker set search_path = public as $$
  update product_images pi set position = o.ord - 1
    from unnest(p_ids) with ordinality as o(id, ord)
   where pi.id = o.id and pi.product_id = p_product
$$;

revoke execute on function catalog_products(text, uuid[], uuid[], boolean), reorder_product_images(uuid, uuid[]),
  guard_product_delete() from public, anon;
grant execute on function catalog_products(text, uuid[], uuid[], boolean), reorder_product_images(uuid, uuid[])
  to authenticated, service_role;
