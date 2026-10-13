import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { PasswordCard } from './PasswordCard';
import { TeamManager, type Member } from './TeamManager';

export default async function Equipe() {
  const { supabase, user, profile } = await requireAdmin();
  const manager = profile.can_manage_team;
  const { data } = manager
    ? await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, can_manage_team, disabled_at')
        .eq('role', 'admin')
        .order('created_at')
    : { data: [] };
  const members: Member[] = data ?? [];

  return (
    <>
      <PageHeader
        title={manager ? 'Équipe' : 'Mon compte'}
        subtitle={
          manager
            ? `${members.filter((m) => !m.disabled_at).length} accès actifs au back-office`
            : `${profile.first_name} ${profile.last_name} · employé`
        }
      />
      <div className="flex grow flex-col gap-4 px-5 pt-2 pb-6 md:gap-6 md:px-8 md:pt-7 md:pb-8">
        {manager && <TeamManager members={members} meId={user.id} />}
        <PasswordCard />
      </div>
    </>
  );
}
