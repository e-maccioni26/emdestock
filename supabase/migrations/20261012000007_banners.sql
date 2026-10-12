-- Lot 5 : accueil et encarts.

-- Flacon dessiné sur l'encart, déduit de la destination à l'enregistrement (produit, 1er produit de la sélection, sinon haut).
alter table banners add column shape placeholder_shape not null default 'tall';

-- Images de fond des encarts : lecture publique, écriture admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('banner-images', 'banner-images', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;
create policy banner_images_admin_write on storage.objects for all
  using (bucket_id = 'banner-images' and public.is_admin())
  with check (bucket_id = 'banner-images' and public.is_admin());

-- Ordre d'affichage : une seule instruction pour tout l'ordre.
create or replace function reorder_banners(p_ids uuid[]) returns void
language sql security invoker set search_path = public as $$
  update banners b set position = o.ord - 1 from unnest(p_ids) with ordinality as o(id, ord) where b.id = o.id
$$;

-- « Les plus commandés » (accueil d'un client sans commande) : unités commandées, commandes annulées exclues.
create or replace function top_ordered_products(p_limit int default 8)
returns table (product_id uuid, units bigint)
language sql stable security definer set search_path = public as $$
  select i.product_id, sum(i.quantity)::bigint as units
    from order_items i
    join orders o on o.id = i.order_id and o.status <> 'cancelled'
    join products p on p.id = i.product_id and p.is_visible
   where my_company_is_active()
   group by i.product_id
   order by units desc, i.product_id
   limit least(greatest(p_limit, 1), 20)
$$;

revoke execute on function reorder_banners(uuid[]), top_ordered_products(int) from public, anon;
grant execute on function reorder_banners(uuid[]), top_ordered_products(int) to authenticated, service_role;
