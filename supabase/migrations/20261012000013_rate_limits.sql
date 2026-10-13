-- Limite d'appels des fonctions publiques (verify-siret est appelable avec la clé anon, avant la création du compte).
-- Une ligne par appel accepté ; les lignes de plus d'un jour sont purgées à chaque appel. Appelée par les Edge Functions
-- (service_role) uniquement : ni anon ni les clients n'y ont accès.
create table rate_limits (
  key text not null,
  at timestamptz not null default now()
);
create index on rate_limits (key, at);
alter table rate_limits enable row level security;
revoke all on rate_limits from anon, authenticated;

-- Vrai (et enregistre l'appel) si la clé a fait moins de p_max appels dans la fenêtre.
create or replace function check_rate_limit(p_key text, p_max int, p_window interval) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext(p_key)); -- deux appels simultanés ne dépassent pas la limite
  delete from rate_limits where at < now() - interval '1 day';
  if (select count(*) from rate_limits where key = p_key and at > now() - p_window) >= p_max then
    return false;
  end if;
  insert into rate_limits (key) values (p_key);
  return true;
end $$;
revoke execute on function check_rate_limit(text, int, interval) from public, anon, authenticated;
grant execute on function check_rate_limit(text, int, interval) to service_role;
