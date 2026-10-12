-- Lot 3 : l'e-mail admin part aussi à chaque nouvelle commande (même mécanisme que les inscriptions).
create or replace function trg_signup_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform notify_edge(case new.type
    when 'signup_request' then jsonb_build_object('type', 'signup_request', 'company_id', new.ref_id)
    else jsonb_build_object('type', 'new_order', 'order_id', new.ref_id) end);
  return new;
end $$;

drop trigger admin_notifications_signup_notify on admin_notifications;
create trigger admin_notifications_notify after insert on admin_notifications
  for each row when (new.type in ('signup_request', 'new_order')) execute function trg_signup_notify();
