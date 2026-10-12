'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

/** Valide ou refuse une demande. L'e-mail client part via le trigger SQL → Edge Function notify. */
export async function decideRequest(
  companyId: string,
  status: 'active' | 'refused',
): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('set_company_status', {
    p_company: companyId,
    p_status: status,
  });
  if (error) return { error: 'L’action a échoué. Réessayez.' };
  revalidatePath('/clients');
  return {};
}
