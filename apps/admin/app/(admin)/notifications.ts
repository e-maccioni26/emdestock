'use server';

import { requireAdmin } from '@/lib/auth';

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from('admin_notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);
  return error ? { error: 'Action impossible.' } : {};
}

export async function markNotificationRead(id: string): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from('admin_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null);
  return error ? { error: 'Action impossible.' } : {};
}
