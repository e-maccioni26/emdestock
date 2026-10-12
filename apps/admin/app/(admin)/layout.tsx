import { Sidebar } from '@/components/Sidebar';
import { requireAdmin } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireAdmin();
  const { count } = await supabase
    .from('companies')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  return (
    <div className="flex min-h-screen">
      <Sidebar
        pendingRequests={count ?? 0}
        name={`${profile.first_name} ${profile.last_name}`.trim() || 'Administrateur'}
      />
      <main className="flex min-w-0 grow flex-col">{children}</main>
    </div>
  );
}
