'use server';

import { revalidatePath } from 'next/cache';
import type { OrderStatus } from '@emd/shared';
import { requireAdmin } from '@/lib/auth';

/** Changement de statut via la fonction SQL set_order_status (l'annulation restitue le stock, statut final). */
export async function changeOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('set_order_status', { p_order: orderId, p_status: status });
  if (error) {
    return {
      error:
        error.message === 'order_cancelled_is_final'
          ? 'Une commande annulée ne peut plus changer de statut.'
          : 'Le changement de statut a échoué. Réessayez.',
    };
  }
  revalidatePath('/commandes');
  revalidatePath(`/commandes/${orderId}`);
  return {};
}
