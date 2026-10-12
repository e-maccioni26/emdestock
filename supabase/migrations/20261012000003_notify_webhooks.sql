-- Lot 1 : e-mails transactionnels. Des triggers appellent l'Edge Function "notify" via pg_net.
-- URL et secret viennent de la table app_settings (jamais en dur dans une migration) :
--   insert into app_settings values ('notify_url', 'https://<projet>.supabase.co/functions/v1/notify'),
--                                   ('notify_secret', '<valeur de NOTIFY_WEBHOOK_SECRET>');
-- Sans ces lignes, les triggers ne font rien. En local, seed.sql les renseigne.
create extension if not exists pg_net with schema extensions;

create table app_settings (key text primary key, value text not null);
alter table app_settings enable row level security; -- aucune policy : illisible hors fonctions security definer
revoke all on app_settings from anon, authenticated;

create or replace function notify_edge(p_payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v_url text := (select value from app_settings where key = 'notify_url');
        v_secret text := (select value from app_settings where key = 'notify_secret');
begin
  if coalesce(v_url, '') = '' or coalesce(v_secret, '') = '' then return; end if;
  perform net.http_post(
    url := v_url,
    body := p_payload,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret));
exception when others then
  -- un e-mail raté ne doit jamais bloquer la validation d'un client ni une inscription
  raise warning 'notify_edge: %', sqlerrm;
end $$;

create or replace function trg_company_status_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform notify_edge(jsonb_build_object('type', 'company_status', 'company_id', new.id,
                                         'old_status', old.status, 'new_status', new.status));
  return new;
end $$;
create trigger companies_status_notify after update of status on companies
  for each row when (old.status is distinct from new.status) execute function trg_company_status_notify();

create or replace function trg_signup_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform notify_edge(jsonb_build_object('type', 'signup_request', 'company_id', new.ref_id));
  return new;
end $$;
create trigger admin_notifications_signup_notify after insert on admin_notifications
  for each row when (new.type = 'signup_request') execute function trg_signup_notify();

revoke execute on function notify_edge(jsonb), trg_company_status_notify(), trg_signup_notify() from public, anon, authenticated;
