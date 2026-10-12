'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type LoginState = { error?: string };

export async function signIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(form.get('email') ?? '').trim(),
    password: String(form.get('password') ?? ''),
  });
  if (error) return { error: 'E-mail ou mot de passe incorrect.' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') {
    await supabase.auth.signOut();
    return { error: 'Ce compte n’a pas accès au back-office.' };
  }
  redirect('/clients');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/connexion');
}
