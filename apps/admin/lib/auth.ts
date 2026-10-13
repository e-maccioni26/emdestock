import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/** Garde d'accès du back-office : un client (ou un visiteur) n'y entre pas. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/connexion');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name, can_manage_team, disabled_at')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profile?.role !== 'admin' || profile.disabled_at) redirect('/connexion?erreur=acces');
  return { supabase, user: data.user, profile };
}
