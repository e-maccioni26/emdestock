// Vérifie un SIRET auprès de l'API Sirene (Insee) et renvoie les infos de l'établissement.
// Réponse : { ok: true, siret, company } ou { ok: false, code } (codes : cf. @emd/shared auth.ts).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

type Etab = {
  siret: string;
  uniteLegale: Record<string, string | null>;
  adresseEtablissement: Record<string, string | null>;
  periodesEtablissement: { dateFin: string | null; etatAdministratifEtablissement: string }[];
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { siret: raw } = await req.json().catch(() => ({ siret: '' }));
  const siret = String(raw ?? '').replace(/[\s.-]/g, '');
  if (!/^\d{14}$/.test(siret)) return json({ ok: false, code: 'invalid_format' });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('siret', siret)
    .maybeSingle();
  if (existing) return json({ ok: false, code: 'already_registered' });

  const res = await fetch(`https://api.insee.fr/api-sirene/3.11/siret/${siret}`, {
    headers: {
      'X-INSEE-Api-Key-Integration': Deno.env.get('INSEE_API_KEY') ?? '',
      Accept: 'application/json',
    },
  });
  if (res.status === 404) return json({ ok: false, code: 'not_found' });
  if (!res.ok) {
    console.error('Sirene', res.status, await res.text());
    return json({ ok: false, code: 'unavailable' });
  }

  const { etablissement: e } = (await res.json()) as { etablissement: Etab };
  const current =
    e.periodesEtablissement.find((p) => p.dateFin === null) ?? e.periodesEtablissement[0];
  if (current?.etatAdministratifEtablissement !== 'A') return json({ ok: false, code: 'inactive' });

  const u = e.uniteLegale;
  const a = e.adresseEtablissement;
  const person = [u.prenomUsuelUniteLegale, u.nomUsageUniteLegale ?? u.nomUniteLegale]
    .filter(Boolean)
    .join(' ');
  return json({
    ok: true,
    siret,
    company: {
      legal_name: u.denominationUniteLegale ?? u.denominationUsuelle1UniteLegale ?? person,
      address: [
        a.numeroVoieEtablissement,
        a.indiceRepetitionEtablissement,
        a.typeVoieEtablissement,
        a.libelleVoieEtablissement,
      ]
        .filter(Boolean)
        .join(' '),
      postal_code: a.codePostalEtablissement ?? '',
      city: a.libelleCommuneEtablissement ?? '',
    },
  });
});
