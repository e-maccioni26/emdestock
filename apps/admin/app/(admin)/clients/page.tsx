import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { formatDayMonth, formatEuro, formatNumber, formatSiret } from '@emd/shared';
import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { ClientSearch } from './ClientSearch';
import { RequestList, type SignupRequest } from './RequestList';

export default async function Clients({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const tab = sp.tab === 'actifs' ? 'actifs' : 'demandes';

  const [{ data: pending }, { data: clients }] = await Promise.all([
    supabase
      .from('companies')
      .select(
        'id, legal_name, siret, address, postal_code, city, created_at, profiles(first_name, last_name, email)',
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase.rpc('admin_clients', { p_query: tab === 'actifs' ? (sp.q ?? '') : '' }),
  ]);
  const requests: SignupRequest[] = (pending ?? []).map((c) => ({
    id: c.id,
    legalName: c.legal_name,
    siret: c.siret,
    address: `${c.address}, ${c.postal_code} ${c.city}`,
    contact: c.profiles[0] ? `${c.profiles[0].first_name} ${c.profiles[0].last_name}` : '',
    email: c.profiles[0]?.email ?? '',
    createdAt: c.created_at,
  }));
  // Total des clients actifs hors recherche pour l'en-tête et l'onglet.
  const { count: activeCount } = await supabase
    .from('companies')
    .select('id', { count: 'exact', head: true })
    .in('status', ['active', 'suspended']);

  const tabs: [string, string, number][] = [
    ['demandes', 'Demandes d’inscription', requests.length],
    ['actifs', 'Clients actifs', activeCount ?? 0],
  ];
  const cols = 'grid-cols-[minmax(0,1.5fr)_150px_80px_96px_120px_124px_16px]';
  return (
    <>
      <PageHeader
        title="Clients"
        subtitle={`${formatNumber(activeCount ?? 0)} clients actifs · ${requests.length} ${requests.length > 1 ? 'demandes' : 'demande'} en attente`}
      />
      <div className="flex grow flex-col gap-6 px-8 pt-7 pb-8">
        <div role="tablist" className="flex gap-1 border-b border-border">
          {tabs.map(([k, label, n]) => (
            <Link
              key={k}
              role="tab"
              aria-selected={tab === k}
              href={k === 'demandes' ? '/clients' : '/clients?tab=actifs'}
              className={`-mb-px inline-flex h-11 items-center gap-2 border-b-2 px-3 text-[14px] ${tab === k ? 'border-ink font-semibold text-ink' : 'border-transparent font-medium text-text-body'}`}
            >
              {label}
              <span className="text-[12px] font-medium text-text-secondary tabular-nums">
                {formatNumber(n)}
              </span>
            </Link>
          ))}
        </div>
        {tab === 'demandes' ? (
          <RequestList initial={requests} />
        ) : (
          <div className="flex flex-col gap-4">
            <ClientSearch q={sp.q ?? ''} />
            <div
              role="table"
              aria-label="Clients actifs"
              className="overflow-hidden rounded-block border border-border bg-white"
            >
              <div
                role="row"
                className={`grid h-11 ${cols} items-center gap-4 border-b border-border bg-surface-alt px-5 text-[12px] font-medium text-text-secondary`}
              >
                <span role="columnheader">Client</span>
                <span role="columnheader">SIRET</span>
                <span role="columnheader" className="text-right">
                  Magasins
                </span>
                <span role="columnheader" className="text-right">
                  Commandes
                </span>
                <span role="columnheader">Dernière cde</span>
                <span role="columnheader" className="text-right">
                  Total HT
                </span>
                <span role="columnheader" />
              </div>
              {(clients ?? []).length === 0 && (
                <p className="px-5 py-10 text-center text-[14px] text-text-secondary">
                  Aucun client ne correspond à cette recherche.
                </p>
              )}
              {(clients ?? []).map((c) => (
                <Link
                  key={c.id}
                  role="row"
                  href={`/clients/${c.id}`}
                  className={`grid h-[60px] ${cols} items-center gap-4 border-b border-divider px-5`}
                >
                  <span role="cell" className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2 truncate text-[14px] font-medium">
                      {c.legal_name}
                      {c.status === 'suspended' && (
                        <span className="rounded-badge bg-divider px-1.5 py-0.5 text-[11px] font-semibold text-text-body">
                          Suspendu
                        </span>
                      )}
                    </span>
                    <span className="text-[12px] text-text-secondary">{c.contact_name}</span>
                  </span>
                  <span role="cell" className="font-mono text-[12px]">
                    {formatSiret(c.siret)}
                  </span>
                  <span role="cell" className="text-right text-[14px] tabular-nums">
                    {c.stores}
                  </span>
                  <span role="cell" className="text-right text-[14px] tabular-nums">
                    {c.orders}
                  </span>
                  <span role="cell" className="text-[13px] text-text-body">
                    {c.last_order_at ? formatDayMonth(c.last_order_at) : '—'}
                  </span>
                  <span role="cell" className="text-right text-[14px] font-semibold tabular-nums">
                    {formatEuro(c.total_ht)}
                  </span>
                  <ChevronRight
                    size={16}
                    strokeWidth={1.8}
                    className="text-text-secondary"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
