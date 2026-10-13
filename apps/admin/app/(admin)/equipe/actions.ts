'use server';

import { revalidatePath } from 'next/cache';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';

const MESSAGES: Record<string, string> = {
  weak_password: 'Mot de passe trop faible : 12 caractères minimum, dont un chiffre.',
  email_taken: 'Cette adresse e-mail est déjà utilisée.',
  invalid_email: 'Adresse e-mail invalide.',
  name_required: 'Prénom et nom requis.',
  self: 'Impossible sur votre propre compte.',
  last_manager: 'Impossible : c’est le dernier gestionnaire d’équipe actif.',
  forbidden: 'Seul un gestionnaire d’équipe peut faire cela.',
};

/** Appelle l'Edge Function admin-users avec la session de l'administrateur (la clé service_role reste côté Supabase). */
async function call(body: Record<string, unknown>): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.functions.invoke('admin-users', { body });
  if (error) {
    let code = '';
    if (error instanceof FunctionsHttpError) {
      code = ((await error.context.json().catch(() => ({}))) as { error?: string }).error ?? '';
    }
    return { error: MESSAGES[code] ?? 'Action impossible. Réessayez.' };
  }
  revalidatePath('/equipe');
  return {};
}

export interface NewMember {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  can_manage_team: boolean;
}

export async function createMember(m: NewMember) {
  return call({ action: 'create', ...m });
}
export async function setMemberDisabled(id: string, disabled: boolean) {
  return call({ action: 'set_disabled', id, disabled });
}
export async function resetMemberPassword(id: string, password: string) {
  return call({ action: 'reset_password', id, password });
}
export async function deleteMember(id: string) {
  return call({ action: 'delete', id });
}
