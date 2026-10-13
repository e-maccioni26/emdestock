// Gestion de l'équipe du back-office (réservée aux administrateurs « gestionnaires d'équipe »).
// POST { action: 'create' | 'set_disabled' | 'reset_password' | 'delete', ... } avec le JWT de l'appelant.
// Utilise la clé service_role pour créer / bloquer / supprimer des utilisateurs Auth.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

const BAN = '876000h'; // ~100 ans : désactivation de la connexion
// Même règle que validatePassword (packages/shared) : 12 caractères dont un chiffre.
const passwordError = (p: unknown) =>
  typeof p !== 'string' || p.length < 12 || !/\d/.test(p) ? 'weak_password' : null;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!jwt) return json({ error: 'unauthorized' }, 401);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data: caller } = await supabase.auth.getUser(jwt);
  if (!caller.user) return json({ error: 'unauthorized' }, 401);
  const { data: me } = await supabase
    .from('profiles')
    .select('role, can_manage_team, disabled_at, first_name, last_name')
    .eq('id', caller.user.id)
    .maybeSingle();
  if (me?.role !== 'admin' || !me.can_manage_team || me.disabled_at) {
    return json({ error: 'forbidden' }, 403);
  }

  // Journal d'actions : les triggers SQL ne voient pas la clé service_role, on écrit donc la ligne ici.
  const log = (action: string, id: string, label: string, changes: Record<string, unknown> = {}) =>
    supabase.from('audit_log').insert({
      actor_id: caller.user.id,
      actor_name: `${me.first_name} ${me.last_name}`,
      action,
      entity: 'admin_account',
      entity_id: id,
      label,
      changes,
    });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const str = (k: string) => String(body[k] ?? '').trim();

  // Dernier gestionnaire actif : on ne le désactive ni ne le supprime (plus personne ne pourrait gérer l'équipe).
  async function isLastManager(id: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .eq('can_manage_team', true)
      .is('disabled_at', null);
    return (data ?? []).every((m) => m.id === id);
  }
  async function nameOf(id: string) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', id)
      .maybeSingle();
    return data ? `${data.first_name} ${data.last_name} (${data.email})` : id;
  }
  async function target(id: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, role, can_manage_team, disabled_at')
      .eq('id', id)
      .maybeSingle();
    return data?.role === 'admin' ? data : null;
  }

  switch (body.action) {
    case 'create': {
      const first = str('first_name');
      const last = str('last_name');
      const email = str('email').toLowerCase();
      const password = String(body.password ?? '');
      if (!first || !last) return json({ error: 'name_required' }, 400);
      if (!EMAIL.test(email)) return json({ error: 'invalid_email' }, 400);
      if (passwordError(password)) return json({ error: 'weak_password' }, 400);
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error || !data.user) {
        const taken = /already|registered|exists/i.test(error?.message ?? '');
        return json({ error: taken ? 'email_taken' : 'create_failed' }, taken ? 409 : 500);
      }
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        role: 'admin',
        first_name: first,
        last_name: last,
        email,
        can_manage_team: body.can_manage_team === true,
      });
      if (profileError) {
        await supabase.auth.admin.deleteUser(data.user.id); // pas d'utilisateur Auth orphelin
        console.error('admin-users profile', profileError);
        return json({ error: 'create_failed' }, 500);
      }
      await log('create', data.user.id, `${first} ${last} (${email})`, {
        can_manage_team: body.can_manage_team === true,
      });
      return json({ ok: true, id: data.user.id });
    }

    case 'set_disabled': {
      const id = str('id');
      const t = await target(id);
      if (!t) return json({ error: 'not_found' }, 404);
      const disabled = body.disabled === true;
      if (disabled) {
        if (id === caller.user.id) return json({ error: 'self' }, 400);
        if (t.can_manage_team && (await isLastManager(id)))
          return json({ error: 'last_manager' }, 400);
      }
      const { error } = await supabase.auth.admin.updateUserById(id, {
        ban_duration: disabled ? BAN : 'none',
      });
      if (error) return json({ error: 'update_failed' }, 500);
      await supabase
        .from('profiles')
        .update({ disabled_at: disabled ? new Date().toISOString() : null })
        .eq('id', id);
      await log(disabled ? 'disable' : 'enable', id, await nameOf(id));
      return json({ ok: true });
    }

    case 'reset_password': {
      const id = str('id');
      if (!(await target(id))) return json({ error: 'not_found' }, 404);
      if (passwordError(body.password)) return json({ error: 'weak_password' }, 400);
      const { error } = await supabase.auth.admin.updateUserById(id, {
        password: String(body.password),
      });
      if (error) return json({ error: 'update_failed' }, 500);
      await log('reset_password', id, await nameOf(id)); // jamais le mot de passe lui-même
      return json({ ok: true });
    }

    case 'delete': {
      const id = str('id');
      const t = await target(id);
      if (!t) return json({ error: 'not_found' }, 404);
      if (id === caller.user.id) return json({ error: 'self' }, 400);
      if (t.can_manage_team && !t.disabled_at && (await isLastManager(id))) {
        return json({ error: 'last_manager' }, 400);
      }
      const label = await nameOf(id); // avant la suppression : le profil part en cascade
      const { error } = await supabase.auth.admin.deleteUser(id);
      if (error) return json({ error: 'delete_failed' }, 500);
      await log('delete', id, label);
      return json({ ok: true });
    }

    default:
      return json({ error: 'unknown_action' }, 400);
  }
});
