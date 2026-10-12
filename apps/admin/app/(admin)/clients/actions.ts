'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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

/** Suspension / réactivation : la RLS coupe l'accès du client immédiatement, l'app mobile l'apprend en temps réel. */
export async function setSuspended(
  companyId: string,
  suspended: boolean,
): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('set_company_status', {
    p_company: companyId,
    p_status: suspended ? 'suspended' : 'active',
  });
  if (error) return { error: 'L’action a échoué. Réessayez.' };
  revalidatePath('/clients');
  revalidatePath(`/clients/${companyId}`);
  return {};
}

/** Suppression du compte client : Edge Function delete-account (commandes conservées, données personnelles effacées). */
export async function deleteClient(companyId: string): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.functions.invoke('delete-account', {
    body: { company_id: companyId },
  });
  if (error) return { error: 'La suppression a échoué. Réessayez.' };
  revalidatePath('/clients');
  redirect('/clients?tab=actifs');
}

export interface CompanyInput {
  legal_name: string;
  address: string;
  postal_code: string;
  city: string;
  phone: string;
}

export async function updateCompany(
  companyId: string,
  v: CompanyInput,
): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  if (
    !v.legal_name.trim() ||
    !v.address.trim() ||
    !/^\d{5}$/.test(v.postal_code.trim()) ||
    !v.city.trim()
  )
    return { error: 'Vérifiez les champs (code postal à 5 chiffres).' };
  const { error } = await supabase
    .from('companies')
    .update({
      legal_name: v.legal_name.trim(),
      address: v.address.trim(),
      postal_code: v.postal_code.trim(),
      city: v.city.trim(),
      phone: v.phone.trim() || null,
    })
    .eq('id', companyId);
  if (error) return { error: 'L’enregistrement a échoué.' };
  revalidatePath(`/clients/${companyId}`);
  return {};
}

export interface StoreInput {
  name: string;
  address: string;
  postal_code: string;
  city: string;
}

export async function saveStore(
  companyId: string,
  storeId: string | null,
  v: StoreInput,
): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  if (
    !v.name.trim() ||
    !v.address.trim() ||
    !/^\d{5}$/.test(v.postal_code.trim()) ||
    !v.city.trim()
  )
    return { error: 'Vérifiez les champs (code postal à 5 chiffres).' };
  const row = {
    name: v.name.trim(),
    address: v.address.trim(),
    postal_code: v.postal_code.trim(),
    city: v.city.trim(),
  };
  const { error } = storeId
    ? await supabase.from('stores').update(row).eq('id', storeId).eq('company_id', companyId)
    : await supabase.from('stores').insert({ company_id: companyId, ...row });
  if (error) return { error: 'L’enregistrement a échoué.' };
  revalidatePath(`/clients/${companyId}`);
  return {};
}

/** Case « Ancien client » : enregistrée, sans effet en V1 (tarifs préférentiels en V2). */
export async function setFormerClient(
  companyId: string,
  value: boolean,
): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from('companies')
    .update({ is_former_client: value })
    .eq('id', companyId);
  if (error) return { error: 'Modification impossible.' };
  revalidatePath(`/clients/${companyId}`);
  return {};
}
