import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatNumber, formatShortDateTime } from '@emd/shared';
import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { JournalFilters } from './JournalFilters';
import { ACTION_LABELS, ENTITY_LABELS, describeChanges, entityHref } from './format';

const PAGE_SIZE = 25;
type Params = { who?: string; entity?: string; period?: string; page?: string };

export default async function Journal({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const { supabase, profile } = await requireAdmin();
  if (!profile.can_manage_team) redirect('/'); // le journal est réservé aux gestionnaires d'équipe
  const period = sp.period ?? '30';
  const page = Math.max(1, Number(sp.page) || 1);
  const since = /^\d+$/.test(period)
    ? new Date(Date.now() - Number(period) * 86400_000).toISOString()
    : null;

  let q = supabase
    .from('audit_log')
    .select('id, at, actor_name, action, entity, entity_id, label, changes', { count: 'exact' })
    .order('at', { ascending: false })
    .order('id', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (sp.who) q = q.eq('actor_id', sp.who);
  if (sp.entity) q = q.eq('entity', sp.entity);
  if (since) q = q.gte('at', since);
  const [{ data: rows, count }, { data: admins }] = await Promise.all([
    q,
    supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'admin')
      .order('first_name'),
  ]);

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (over: Partial<Params>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...over }))
      if (v && !(k === 'page' && v === '1')) p.set(k, v);
    const s = p.toString();
    return `/journal${s ? `?${s}` : ''}`;
  };
  const btn =
    'inline-flex h-11 items-center rounded-control border border-border-strong px-4 text-[14px] font-semibold lg:h-9';

  return (
    <>
      <PageHeader title="Journal" subtitle="Qui a modifié quoi dans le back-office" />
      <div className="flex grow flex-col gap-4 px-5 pt-2 pb-6 md:gap-6 md:px-8 md:pt-7 md:pb-8">
        <JournalFilters
          who={sp.who ?? ''}
          entity={sp.entity ?? ''}
          period={period}
          people={(admins ?? []).map((a) => ({ id: a.id, name: `${a.first_name} ${a.last_name}` }))}
        />
        <div
          role="table"
          aria-label="Journal des actions"
          className="flex flex-col gap-2.5 lg:block lg:overflow-hidden lg:rounded-block lg:border lg:border-border lg:bg-white"
        >
          <div
            role="row"
            className="hidden h-11 items-center gap-4 border-b border-border bg-surface-alt px-5 text-[12px] font-medium text-text-secondary lg:grid lg:grid-cols-[130px_160px_190px_minmax(0,1fr)]"
          >
            <span role="columnheader">Date</span>
            <span role="columnheader">Personne</span>
            <span role="columnheader">Action</span>
            <span role="columnheader">Détail</span>
          </div>
          {(rows ?? []).length === 0 && (
            <p className="px-6 py-12 text-center text-[14px] text-text-secondary">
              Aucune action ne correspond à ces critères.
            </p>
          )}
          {(rows ?? []).map((r) => {
            const lines = describeChanges(r.entity, r.action, r.changes);
            const link = entityHref(r.entity, r.entity_id);
            return (
              <div
                key={r.id}
                role="row"
                className="grid gap-x-4 gap-y-1 rounded-card border border-border bg-white px-4 py-3.5 lg:grid-cols-[130px_160px_190px_minmax(0,1fr)] lg:rounded-none lg:border-0 lg:border-b lg:border-divider lg:px-5 lg:py-3"
              >
                <span role="cell" className="text-[13px] text-text-secondary tabular-nums">
                  {formatShortDateTime(r.at)}
                </span>
                <span role="cell" className="text-[14px] font-medium">
                  {r.actor_name}
                </span>
                <span role="cell" className="text-[13px] text-text-body">
                  {ACTION_LABELS[r.action] ?? r.action} · {ENTITY_LABELS[r.entity] ?? r.entity}
                </span>
                <span role="cell" className="flex min-w-0 flex-col gap-0.5 text-[13px]">
                  {r.label &&
                    (link ? (
                      <Link
                        href={link}
                        className="truncate font-medium underline underline-offset-2"
                      >
                        {r.label}
                      </Link>
                    ) : (
                      <span className="font-medium break-words">{r.label}</span>
                    ))}
                  {lines.map((l) => (
                    <span key={l} className="break-words text-text-secondary">
                      {l}
                    </span>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
        {pages > 1 && (
          <nav
            aria-label="Pagination"
            className="flex items-center justify-between text-[13px] text-text-secondary"
          >
            <span className="tabular-nums">
              Page {page} sur {pages} · {formatNumber(total)} actions
            </span>
            <span className="flex gap-2">
              {page > 1 && (
                <Link href={href({ page: String(page - 1) })} className={btn}>
                  Précédent
                </Link>
              )}
              {page < pages && (
                <Link href={href({ page: String(page + 1) })} className={btn}>
                  Suivant
                </Link>
              )}
            </span>
          </nav>
        )}
      </div>
    </>
  );
}
