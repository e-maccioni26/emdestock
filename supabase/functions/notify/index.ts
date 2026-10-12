// Appelée par les triggers SQL (pg_net) : e-mail client à l'activation/refus, e-mail admin à chaque demande d'inscription.
// Authentification : en-tête x-webhook-secret = NOTIFY_WEBHOOK_SECRET (verify_jwt désactivé pour cette fonction).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { esc, layout, sendEmail } from '../_shared/email.ts';

type Payload =
  | { type: 'company_status'; company_id: string; old_status: string; new_status: string }
  | { type: 'signup_request'; company_id: string }
  | { type: 'new_order'; order_id: string };

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const when = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Paris',
});

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

  if (payload.type === 'new_order') return notifyOrder(supabase, payload.order_id);

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

// E-mail admin « Nouvelle commande » (maquette AdminEmail).
async function notifyOrder(supabase: ReturnType<typeof createClient>, orderId: string) {
  const to = Deno.env.get('ADMIN_NOTIFICATION_EMAIL');
  if (!to) return new Response('ADMIN_NOTIFICATION_EMAIL manquant', { status: 500 });
  const { data: o } = await supabase
    .from('orders')
    .select(
      'id, number, message, total_ht, units, created_at, companies(legal_name), stores(name, address, postal_code, city), profiles:created_by(first_name, last_name), order_items(reference, title, ean, unit_price_ht, quantity, line_total_ht)',
    )
    .eq('id', orderId)
    .single();
  if (!o) return new Response('order not found', { status: 404 });

  const rows = (
    o.order_items as {
      reference: string;
      title: string;
      ean: string;
      quantity: number;
      line_total_ht: number;
    }[]
  )
    .map(
      (i) => `<tr>
<td style="padding:12px 0;border-bottom:1px solid #F0F0F0;font-size:14px"><span style="display:block;font-weight:500">${esc(i.title)}</span><span style="font-family:'Geist Mono',monospace;font-size:12px;color:#6B6B6B">${esc(i.reference)} · EAN ${esc(i.ean)}</span></td>
<td style="padding:12px 0;border-bottom:1px solid #F0F0F0;text-align:right;font-size:14px">${i.quantity}</td>
<td style="padding:12px 0;border-bottom:1px solid #F0F0F0;text-align:right;font-size:14px;font-weight:600">${eur.format(i.line_total_ht)}</td></tr>`,
    )
    .join('');
  const th =
    'padding:0 0 8px;border-bottom:1px solid #E5E5E5;font-size:12px;font-weight:500;color:#6B6B6B';
  const contact = o.profiles ? `${o.profiles.first_name} ${o.profiles.last_name}` : '';
  const adminUrl = Deno.env.get('ADMIN_URL');
  const body = `<div style="font-family:'Geist Mono',monospace;font-size:13px;color:#6B6B6B;margin-bottom:16px">${esc(o.number)} · ${esc(when.format(new Date(o.created_at)))}</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:16px"><tr>
<td style="padding:16px;border-radius:12px;background:#F4F4F3;vertical-align:top;font-size:14px"><span style="display:block;font-size:12px;color:#6B6B6B">Client</span><strong>${esc(o.companies.legal_name)}</strong><br><span style="font-size:13px">${esc(contact)}</span></td>
<td style="width:12px"></td>
<td style="padding:16px;border-radius:12px;background:#F4F4F3;vertical-align:top;font-size:14px"><span style="display:block;font-size:12px;color:#6B6B6B">Magasin de livraison</span><strong>${esc(o.stores.name)}</strong><br><span style="font-size:13px">${esc(o.stores.address)}, ${esc(o.stores.postal_code)} ${esc(o.stores.city)}</span></td></tr></table>
<table style="width:100%;border-collapse:collapse"><thead><tr><th style="${th};text-align:left">Produit</th><th style="${th};text-align:right">Qté</th><th style="${th};text-align:right">Total HT</th></tr></thead><tbody>${rows}</tbody></table>
<table style="width:100%;margin:16px 0"><tr><td style="font-size:14px;font-weight:600">Total estimé · ${o.units} unités</td><td style="text-align:right;font-size:20px;font-weight:600">${eur.format(o.total_ht)} HT</td></tr></table>
${o.message ? `<div style="font-size:12px;color:#6B6B6B;margin-bottom:6px">Message du client</div><p style="margin:0;padding:12px 14px;border-left:2px solid #0A0A0A;background:#FAFAFA;font-size:14px;line-height:21px">${esc(o.message)}</p>` : ''}`;

  try {
    await sendEmail(
      to,
      `Nouvelle commande ${o.number} · ${o.stores.name}`,
      layout({
        title: 'Nouvelle commande reçue',
        body,
        cta: adminUrl
          ? { label: 'Ouvrir dans le back-office', url: `${adminUrl}/commandes/${o.id}` }
          : undefined,
        footer: 'E-mail automatique envoyé à l’administrateur à chaque nouvelle commande.',
      }),
    );
    await supabase.from('order_events').insert({ order_id: o.id, type: 'admin_email_sent' });
  } catch (err) {
    console.error('notify order', err);
    return new Response('email failed', { status: 502 });
  }
  return new Response('ok');
}
