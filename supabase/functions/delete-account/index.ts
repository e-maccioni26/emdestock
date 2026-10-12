// Suppression de compte (exigence Apple, SPEC §2).
// - Client : supprime son propre compte (corps vide).
// - Admin : { company_id } supprime le compte client d'une entreprise (fiche client).
// Effets : utilisateurs Auth et profils supprimés, entreprise passée en "deleted", téléphone effacé.
// Les commandes restent (comptabilité), rattachées à la raison sociale et au SIRET.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!jwt) return json({ error: 'unauthorized' }, 401);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: caller } = await supabase.auth.getUser(jwt);
  if (!caller.user) return json({ error: 'unauthorized' }, 401);
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', caller.user.id)
    .maybeSingle();
  if (!profile) return json({ error: 'forbidden' }, 403);

  const body = (await req.json().catch(() => ({}))) as { company_id?: string };
  let companyId: string | null;
  if (profile.role === 'admin') {
    if (!body.company_id) return json({ error: 'company_id required' }, 400);
    companyId = body.company_id;
  } else {
    companyId = profile.company_id; // un client ne supprime jamais que son propre compte
  }
  if (!companyId) return json({ error: 'no company' }, 400);

  // 1. Entreprise : statut "deleted" et données personnelles effacées (idempotent).
  const { error: companyError } = await supabase
    .from('companies')
    .update({ status: 'deleted', phone: null })
    .eq('id', companyId);
  if (companyError) {
    console.error('delete-account company', companyError);
    return json({ error: 'company update failed' }, 500);
  }

  // 2. Utilisateurs : la suppression Auth supprime aussi le profil (cascade) ; les commandes gardent created_by = null.
  const { data: members } = await supabase
    .from('profiles')
    .select('id')
    .eq('company_id', companyId);
  for (const m of members ?? []) {
    const { error } = await supabase.auth.admin.deleteUser(m.id);
    if (error) {
      console.error('delete-account user', m.id, error);
      return json({ error: 'user deletion failed' }, 500);
    }
  }
  return json({ ok: true });
});
