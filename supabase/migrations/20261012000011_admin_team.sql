-- Équipe du back-office : plusieurs administrateurs. Seuls les « gestionnaires d'équipe » créent, désactivent ou
-- suppriment des comptes (Edge Function admin-users, clé service_role). Un compte désactivé perd tout accès.
alter table profiles
  add column can_manage_team boolean not null default false,
  add column disabled_at timestamptz,
  add constraint profiles_team_admin_only check (not can_manage_team or role = 'admin');

-- Les administrateurs existants (propriétaires) gèrent l'équipe.
update profiles set can_manage_team = true where role = 'admin';

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and disabled_at is null)
$$;

-- La policy admin_all laisse un admin écrire dans profiles : sans garde, un employé pourrait se promouvoir
-- (can_manage_team, role) ou transformer un client en admin. Seul service_role (admin-users) peut le faire ;
-- l'absence de JWT (migrations, seed, tests) reste autorisée.
create or replace function guard_profile_privileges() returns trigger
language plpgsql set search_path = public as $$
begin
  if coalesce(auth.role(), '') not in ('authenticated', 'anon') then return coalesce(new, old); end if;
  if tg_op = 'INSERT' and new.role = 'admin' then raise exception 'forbidden'; end if;
  if tg_op = 'DELETE' and old.role = 'admin' then raise exception 'forbidden'; end if;
  if tg_op = 'UPDATE' and (new.role is distinct from old.role
      or new.can_manage_team is distinct from old.can_manage_team
      or new.disabled_at is distinct from old.disabled_at) then
    raise exception 'forbidden';
  end if;
  return coalesce(new, old);
end $$;
create trigger profiles_guard before insert or update or delete on profiles
  for each row execute function guard_profile_privileges();
