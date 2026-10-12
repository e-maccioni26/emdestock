// Appelée par les triggers SQL (pg_net) : e-mail client à l'activation/refus, e-mail admin à chaque demande d'inscription.
// Authentification : en-tête x-webhook-secret = NOTIFY_WEBHOOK_SECRET (verify_jwt désactivé pour cette fonction).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { esc, layout, sendEmail } from '../_shared/email.ts';

type Payload =
  | { type: 'company_status'; company_id: string; old_status: string; new_status: string }
  | { type: 'signup_request'; company_id: string };

const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

Deno.serve(async (req) => {
  const secret = Deno.env.get('NOTIFY_WEBHOOK_SECRET') ?? '';
  if (!secret || !timingSafeEqual(req.headers.get('x-webhook-secret') ?? '', secret)) {
    return new Response('forbidden', { status: 403 });
  }
  const payload = (await req.json()) as Payload;
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: company } = await supabase
    .from('companies')
    .select('legal_name, siret, city, profiles(first_name, last_name, email)')
    .eq('id', payload.company_id)
    .single();
  if (!company) return new Response('company not found', { status: 404 });
  const contact = company.profiles?.[0];

  try {
    if (payload.type === 'signup_request') {
      const to = Deno.env.get('ADMIN_NOTIFICATION_EMAIL');
      if (!to) throw new Error('ADMIN_NOTIFICATION_EMAIL manquant');
      const adminUrl = Deno.env.get('ADMIN_URL');
      await sendEmail(
        to,
        `Nouvelle demande d'inscription · ${company.legal_name}`,
        layout({
          title: 'Nouvelle demande d’inscription',
          body: `<strong>${esc(company.legal_name)}</strong><br>SIRET ${esc(company.siret)} · ${esc(company.city)}<br>${
            contact
              ? `${esc(contact.first_name)} ${esc(contact.last_name)} · ${esc(contact.email)}`
              : ''
          }`,
          cta: adminUrl
            ? { label: 'Ouvrir dans le back-office', url: `${adminUrl}/clients` }
            : undefined,
          footer: 'E-mail automatique envoyé à l’administrateur à chaque demande d’inscription.',
        }),
      );
    } else if (payload.type === 'company_status' && contact) {
      if (payload.new_status === 'active' && payload.old_status !== 'active') {
        await sendEmail(
          contact.email,
          'Votre compte est activé',
          layout({
            title: 'Votre compte est activé',
            body: `Bonjour ${esc(contact.first_name)},<br><br>EMD DESTOCK a validé l’accès de ${esc(company.legal_name)}. Vous pouvez dès maintenant vous connecter à l’application pour consulter le catalogue et passer commande.`,
            footer: 'EMD DESTOCK · Accès réservé aux professionnels.',
          }),
        );
      } else if (payload.new_status === 'refused') {
        await sendEmail(
          contact.email,
          'Votre demande d’accès EMD DESTOCK',
          layout({
            title: 'Votre demande d’accès',
            body: `Bonjour ${esc(contact.first_name)},<br><br>Nous n’avons pas pu donner suite à la demande d’accès de ${esc(company.legal_name)}. Pour en savoir plus, contactez EMD DESTOCK.`,
            footer: 'EMD DESTOCK · Accès réservé aux professionnels.',
          }),
        );
      }
    }
  } catch (err) {
    console.error('notify', err);
    return new Response('email failed', { status: 502 });
  }
  return new Response('ok');
});
