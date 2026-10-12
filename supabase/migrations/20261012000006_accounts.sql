-- Lot 4 : magasins, liste des clients, suppression de compte, accès en temps réel.

-- L'Edge Function delete-account (service_role) doit pouvoir passer l'entreprise en "deleted".
create or replace function guard_company_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and coalesce(auth.role(), '') <> 'service_role'
     and (new.siret <> old.siret or new.status <> old.status
          or new.is_former_client <> old.is_former_client or new.validated_at is distinct from old.validated_at) then
    raise exception 'forbidden_field';
  end if;
  return new;
end $$;

-- Magasins : suppression si aucune commande, sinon archivage (SPEC §2). Le dernier magasin actif reste.
create policy own_stores_delete on stores for delete
  using (company_id = my_company_id() and my_company_is_active());

create or replace function remove_store(p_store uuid) returns text
language plpgsql security invoker set search_path = public as $$
declare v_company uuid := my_company_id(); v_archived timestamptz;
begin
  select archived_at into v_archived from stores where id = p_store and company_id = v_company;
  if not found then raise exception 'not_found'; end if;
  if v_archived is null and (select count(*) from stores where company_id = v_company and archived_at is null) <= 1 then
    raise exception 'last_store';
  end if;
  if exists (select 1 from orders where store_id = p_store) then
    update stores set archived_at = coalesce(archived_at, now()) where id = p_store;
    return 'archived';
  end if;
  delete from stores where id = p_store;
  return 'deleted';
end $$;

-- Liste « Clients actifs » du back-office. Commandes, total et dernière commande excluent les annulées.
create or replace function admin_clients(p_query text default null)
returns table (id uuid, legal_name text, siret char(14), status company_status, contact_name text,
               stores int, orders int, last_order_at timestamptz, total_ht numeric)
language sql stable security invoker set search_path = public as $$
  with q as (select lower(unaccent_immutable(trim(coalesce(p_query, '')))) as t),
  base as (
    select c.*, (select p.first_name || ' ' || p.last_name from profiles p where p.company_id = c.id order by p.created_at limit 1) as contact
      from companies c where c.status in ('active', 'suspended'))
  select b.id, b.legal_name, b.siret, b.status, b.contact,
         (select count(*)::int from stores s where s.company_id = b.id and s.archived_at is null),
         (select count(*)::int from orders o where o.company_id = b.id and o.status <> 'cancelled'),
         (select max(o.created_at) from orders o where o.company_id = b.id and o.status <> 'cancelled'),
         coalesce((select sum(o.total_ht) from orders o where o.company_id = b.id and o.status <> 'cancelled'), 0)
    from base b, q
   where q.t = ''
      or strpos(lower(unaccent_immutable(b.legal_name)), q.t) > 0
      or strpos(b.siret, regexp_replace(q.t, '\s', '', 'g')) > 0
      or strpos(lower(unaccent_immutable(coalesce(b.contact, ''))), q.t) > 0
   order by b.legal_name
$$;

revoke execute on function remove_store(uuid), admin_clients(text) from public, anon;
grant execute on function remove_store(uuid), admin_clients(text) to authenticated, service_role;

-- Le statut de l'entreprise est diffusé en temps réel : un client suspendu perd l'accès sans relancer l'app.
alter publication supabase_realtime add table companies;
