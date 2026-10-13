import { NotificationBell } from '@/components/NotificationBell';
import Image from 'next/image';
import { Sidebar } from '@/components/Sidebar';
import { TabBar } from '@/components/TabBar';
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
        canManageTeam={profile.can_manage_team}
      />
      <TabBar
        pendingRequests={pending ?? 0}
        newOrders={received ?? 0}
        canManageTeam={profile.can_manage_team}
      />
      <main className="relative flex min-w-0 grow flex-col pb-[calc(65px+env(safe-area-inset-bottom))] md:pb-0">
        <NotificationBell initial={notifications ?? []} />
        <div className="flex h-14 items-center gap-2 px-5 pt-[env(safe-area-inset-top)] md:hidden print:hidden">
          <Image
            src="/logo-emd.jpg"
            alt="EMD DESTOCK"
            width={56}
            height={33}
            className="h-auto w-14 object-contain object-left mix-blend-multiply"
          />
          <span className="rounded-badge border border-border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-text-secondary uppercase">
            Admin
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
