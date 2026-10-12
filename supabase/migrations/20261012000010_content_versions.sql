-- Mise à jour en direct de l'accueil mobile : les clients ne peuvent pas lire `banners` (my_banners filtre dates et audience),
-- donc Realtime ne leur transmettrait rien. Une table minimale (une ligne par type de contenu) est mise à jour par
-- trigger à chaque modification d'encart ; l'app écoute cette ligne et relit my_banners. Aucune donnée d'encart n'y figure.
create table content_versions (
  key text primary key,
  updated_at timestamptz not null default now()
);
alter table content_versions enable row level security;
create policy read_versions on content_versions for select using (my_company_is_active() or is_admin());
revoke all on content_versions from anon, authenticated;
grant select on content_versions to authenticated;

create or replace function bump_content_version() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into content_versions (key, updated_at) values (tg_argv[0], clock_timestamp())
  on conflict (key) do update set updated_at = excluded.updated_at;
  return null;
end $$;

create trigger banners_bump after insert or update or delete on banners
  for each statement execute function bump_content_version('banners');
create trigger banner_products_bump after insert or update or delete on banner_products
  for each statement execute function bump_content_version('banners');

alter publication supabase_realtime add table content_versions;
