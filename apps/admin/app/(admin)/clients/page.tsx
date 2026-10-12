import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { RequestList, type SignupRequest } from './RequestList';

export default async function Clients() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from('companies')
    .select(
      'id, legal_name, siret, address, postal_code, city, created_at, profiles(first_name, last_name, email)',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const requests: SignupRequest[] = (data ?? []).map((c) => ({
    id: c.id,
    legalName: c.legal_name,
    siret: c.siret,
    address: `${c.address}, ${c.postal_code} ${c.city}`,
    contact: c.profiles[0] ? `${c.profiles[0].first_name} ${c.profiles[0].last_name}` : '',
    email: c.profiles[0]?.email ?? '',
    createdAt: c.created_at,
  }));

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle={`${requests.length} ${requests.length > 1 ? 'demandes' : 'demande'} en attente`}
      />
      <div className="flex grow flex-col gap-6 px-8 pt-7 pb-8">
        <div role="tablist" className="flex gap-1 border-b border-border">
          <span
            role="tab"
            aria-selected="true"
            className="-mb-px inline-flex h-11 items-center gap-2 border-b-2 border-ink px-3 text-[14px] font-semibold"
          >
            Demandes d’inscription
            <span className="text-[12px] font-medium text-text-secondary tabular-nums">
              {requests.length}
            </span>
          </span>
        </div>
        <RequestList initial={requests} />
      </div>
    </>
  );
}
