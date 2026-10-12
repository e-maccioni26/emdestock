-- Lot 6 : statistiques à l'heure de Paris, notifications admin en temps réel.
-- Les bornes de période (semaine, mois, année) suivent le fuseau Europe/Paris, pas celui du serveur (UTC) :
-- une commande passée à 00h30 à Paris le 1er du mois appartient bien à ce mois.
-- Séries : jours (semaine), semaines ISO (mois, bornées au mois), mois (année). Commandes annulées exclues.
drop function admin_stats(text, date);
create function admin_stats(p_period text, p_ref date default (now() at time zone 'Europe/Paris')::date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_unit text := case p_period when 'week' then 'week' when 'month' then 'month' else 'year' end;
  v_start timestamp := date_trunc(v_unit, p_ref::timestamp);
  v_end timestamp := v_start + ('1 ' || v_unit)::interval;
  v_from timestamptz := v_start at time zone 'Europe/Paris';
  v_to timestamptz := v_end at time zone 'Europe/Paris';
  v_pfrom timestamptz := (v_start - ('1 ' || v_unit)::interval) at time zone 'Europe/Paris';
  v_bucket text := case p_period when 'week' then 'day' when 'month' then 'week' else 'month' end;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'period', p_period,
    'period_start', v_start::date,
    'current', (select jsonb_build_object('orders', count(*), 'units', coalesce(sum(units), 0),
                       'total_ht', coalesce(sum(total_ht), 0), 'active_clients', count(distinct company_id))
                  from orders where status <> 'cancelled' and created_at >= v_from and created_at < v_to),
    'previous', (select jsonb_build_object('orders', count(*), 'units', coalesce(sum(units), 0),
                        'total_ht', coalesce(sum(total_ht), 0), 'active_clients', count(distinct company_id))
                   from orders where status <> 'cancelled' and created_at >= v_pfrom and created_at < v_from),
    'series', (select coalesce(jsonb_agg(jsonb_build_object('bucket', to_char(b, 'YYYY-MM-DD'), 'orders', n) order by b), '[]')
                 from (select gs as b,
                              (select count(*) from orders o
                                where o.status <> 'cancelled'
                                  and o.created_at >= greatest(gs at time zone 'Europe/Paris', v_from)
                                  and o.created_at < least((gs + ('1 ' || v_bucket)::interval) at time zone 'Europe/Paris', v_to)) as n
                         from generate_series(case when v_bucket = 'week' then date_trunc('week', v_start) else v_start end,
                                              v_end - interval '1 second', ('1 ' || v_bucket)::interval) gs) s),
    'top_products', (select coalesce(jsonb_agg(t), '[]') from (
                       select i.product_id, i.title, i.reference, sum(i.quantity) as units
                         from order_items i join orders o on o.id = i.order_id
                        where o.status <> 'cancelled' and o.created_at >= v_from and o.created_at < v_to
                        group by 1, 2, 3 order by units desc, i.title limit 5) t),
    'top_stores', (select coalesce(jsonb_agg(t), '[]') from (
                     select s.id, s.name, c.legal_name, count(*) as orders, sum(o.total_ht) as total_ht
                       from orders o join stores s on s.id = o.store_id join companies c on c.id = o.company_id
                      where o.status <> 'cancelled' and o.created_at >= v_from and o.created_at < v_to
                      group by 1, 2, 3 order by total_ht desc, s.name limit 5) t)
  );
end $$;
revoke execute on function admin_stats(text, date) from public, anon;
grant execute on function admin_stats(text, date) to authenticated, service_role;

-- Cloche du back-office : nouvelles notifications en direct (RLS admin appliquée au flux).
alter publication supabase_realtime add table admin_notifications;

-- Les prédicats de RLS doivent rester exécutables par anon : Realtime évalue les politiques pour chaque abonné,
-- et un refus (42501) sur un seul abonné anonyme fait échouer la diffusion pour tous. Sans session, ils renvoient faux / null.
grant execute on function is_admin(), my_company_id(), my_company_is_active() to anon;
