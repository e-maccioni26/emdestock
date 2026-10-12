import { NotificationBell } from '@/components/NotificationBell';
import { Sidebar } from '@/components/Sidebar';
import { requireAdmin } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireAdmin();
  const [{ count: pending }, { count: received }, { data: notifications }] = await Promise.all([
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'received'),
    supabase
      .from('admin_notifications')
      .select('id, type, ref_id, title, body, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);
  return (
    <div className="flex min-h-screen">
      <Sidebar
        pendingRequests={pending ?? 0}
        newOrders={received ?? 0}
        name={`${profile.first_name} ${profile.last_name}`.trim() || 'Administrateur'}
      />
      <main className="relative flex min-w-0 grow flex-col">
        <NotificationBell initial={notifications ?? []} />
        {children}
      </main>
    </div>
  );
}
