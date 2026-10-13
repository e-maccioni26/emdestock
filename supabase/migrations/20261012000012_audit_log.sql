-- (1) Les commandes ne se modifient plus directement : le statut passe par set_order_status (stock, historique),
--     seul `viewed_at` (point rouge « non consultée ») reste modifiable par un administrateur.
revoke update on orders from anon, authenticated;
grant update (viewed_at) on orders to authenticated;

-- (2) Journal d'actions : qui a modifié quoi. Ajout seulement (aucune écriture directe, ni modification, ni suppression
--     possible depuis l'API), lecture réservée aux gestionnaires d'équipe.
create table audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,                              -- sans clé étrangère : la ligne survit à la suppression du compte
  actor_name text not null,                   -- nom copié au moment de l'action
  action text not null,                       -- create | update | delete | disable | enable | reset_password | delete_account
  entity text not null,                       -- product, company, store, order, banner, admin_account…
  entity_id uuid,
  label text,                                 -- libellé lisible (titre du produit, nom du client…)
  changes jsonb not null default '{}'         -- update : {colonne: [avant, après]} ; create/delete : la ligne
);
create index on audit_log (at desc);
create index on audit_log (actor_id, at desc);
create index on audit_log (entity, entity_id);
alter table audit_log enable row level security;
revoke all on audit_log from anon, authenticated;
grant select on audit_log to authenticated;

create or replace function is_team_manager() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles
                  where id = auth.uid() and role = 'admin' and can_manage_team and disabled_at is null)
$$;
create policy read_audit on audit_log for select using (is_team_manager());

-- Les textes longs sont tronqués pour garder le journal léger.
create or replace function audit_clip(j jsonb) returns jsonb
language sql immutable as $$
  select case when jsonb_typeof(j) = 'string' and char_length(j #>> '{}') > 200
              then to_jsonb(left(j #>> '{}', 200) || '…') else j end
$$;

create or replace function audit_label(p_entity text, p_row jsonb) returns text
language sql stable security definer set search_path = public as $$
  select case p_entity
    when 'product' then p_row ->> 'title'
    when 'product_image' then 'Photo de ' || coalesce((select title from products where id = (p_row ->> 'product_id')::uuid), '?')
    when 'brand' then p_row ->> 'name'
    when 'category' then p_row ->> 'name'
    when 'company' then p_row ->> 'legal_name'
    when 'store' then (p_row ->> 'name') || ' (' || coalesce((select legal_name from companies where id = (p_row ->> 'company_id')::uuid), '?') || ')'
    when 'banner' then p_row ->> 'title'
    when 'order' then p_row ->> 'number'
    when 'profile' then (p_row ->> 'first_name') || ' ' || (p_row ->> 'last_name')
    else null end
$$;

-- Écrit une ligne au nom de l'administrateur connecté (aucun effet pour un client, un compte désactivé ou le système).
create or replace function audit_add(p_entity text, p_action text, p_entity_id uuid, p_label text, p_changes jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  select first_name || ' ' || last_name into v_name
    from profiles where id = auth.uid() and role = 'admin' and disabled_at is null;
  if v_name is null then return; end if;
  insert into audit_log (actor_id, actor_name, action, entity, entity_id, label, changes)
  values (auth.uid(), v_name, p_action, p_entity, p_entity_id, p_label, coalesce(p_changes, '{}'));
end $$;

-- Trigger générique : tg_argv[0] = type d'élément.
create or replace function audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_skip text[] := array['updated_at', 'created_at', 'viewed_at'];
  v_old jsonb; v_new jsonb; v_row jsonb; v_changes jsonb := '{}'; k text; v_id uuid;
begin
  if auth.uid() is null then return null; end if; -- migrations, seed, service_role : journalisés à part si besoin
  v_row := to_jsonb(case when tg_op = 'DELETE' then old else new end);
  v_id := (v_row ->> 'id')::uuid;
  if tg_op = 'UPDATE' then
    v_old := to_jsonb(old); v_new := to_jsonb(new);
    for k in select key from jsonb_each(v_new) where key <> all (v_skip) loop
      if v_new -> k is distinct from v_old -> k then
        v_changes := v_changes || jsonb_build_object(k, jsonb_build_array(audit_clip(v_old -> k), audit_clip(v_new -> k)));
      end if;
    end loop;
    if v_changes = '{}' then return null; end if; -- rien de changé : pas de ligne
  else
    select coalesce(jsonb_object_agg(key, audit_clip(value)), '{}') into v_changes
      from jsonb_each(v_row) where key <> all (v_skip);
  end if;
  perform audit_add(tg_argv[0], case tg_op when 'INSERT' then 'create' else lower(tg_op) end, v_id, audit_label(tg_argv[0], v_row), v_changes);
  return null;
end $$;

create trigger audit_products after insert or update or delete on products
  for each row execute function audit_row('product');
create trigger audit_product_images after insert or delete on product_images
  for each row execute function audit_row('product_image');
create trigger audit_brands after insert or update or delete on brands
  for each row execute function audit_row('brand');
create trigger audit_categories after insert or update or delete on categories
  for each row execute function audit_row('category');
create trigger audit_companies after update on companies
  for each row execute function audit_row('company');
create trigger audit_stores after insert or update or delete on stores
  for each row execute function audit_row('store');
create trigger audit_banners after insert or update or delete on banners
  for each row execute function audit_row('banner');
create trigger audit_profiles after update on profiles
  for each row execute function audit_row('profile');
-- Commandes : seuls les changements de statut (viewed_at est ignoré).
create trigger audit_orders after update on orders
  for each row when (old.status is distinct from new.status) execute function audit_row('order');

-- Visibilité par client : on ne touche que ce qui change (sinon chaque enregistrement d'un produit
-- supprimerait puis recréerait toutes les exclusions) et on journalise chaque ajout / retrait.
create or replace function set_product_exclusions(p_product uuid, p_companies uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare v_title text; r record;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  select title into v_title from products where id = p_product;
  for r in
    with gone as (
      delete from product_exclusions
       where product_id = p_product and company_id <> all (coalesce(p_companies, '{}'))
      returning company_id
    ) select company_id, 'delete' as op from gone
  loop
    perform audit_add('product_visibility', 'delete', p_product,
      v_title || ' : de nouveau visible pour ' || (select legal_name from companies where id = r.company_id), '{}');
  end loop;
  for r in
    with added as (
      insert into product_exclusions (product_id, company_id)
        select p_product, c from unnest(coalesce(p_companies, '{}')) c on conflict do nothing
      returning company_id
    ) select company_id from added
  loop
    perform audit_add('product_visibility', 'create', p_product,
      v_title || ' : masqué pour ' || (select legal_name from companies where id = r.company_id), '{}');
  end loop;
end $$;

-- Pour les changements que les triggers ne voient pas (sélection de produits d'un encart…).
create or replace function audit_note(p_entity text, p_action text, p_entity_id uuid, p_label text, p_changes jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  perform audit_add(p_entity, p_action, p_entity_id, p_label, p_changes);
end $$;

-- Fonctions de journal : jamais appelables par anon ; audit_add / audit_label restent internes.
revoke execute on function audit_add(text, text, uuid, text, jsonb), audit_label(text, jsonb), audit_row(),
  audit_note(text, text, uuid, text, jsonb), is_team_manager() from public, anon, authenticated;
grant execute on function audit_note(text, text, uuid, text, jsonb), is_team_manager() to authenticated, service_role;
