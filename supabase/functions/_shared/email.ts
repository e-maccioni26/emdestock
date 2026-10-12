// Envoi via Resend. L'expéditeur vient de EMAIL_FROM (domaine encore à configurer, SPEC §5).
// EMAIL_DRY_RUN=1 : journalise au lieu d'envoyer (tests locaux).

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Gabarit HTML simple, style de la maquette AdminEmail (fond Pierre, carte blanche, bouton noir). */
export function layout(opts: {
  title: string;
  body: string;
  cta?: { label: string; url: string };
  footer: string;
}) {
  const logo = Deno.env.get('EMAIL_LOGO_URL');
  const brand = logo
    ? `<img src="${esc(logo)}" alt="EMD DESTOCK" width="72" style="display:block">`
    : `<span style="font-size:15px;font-weight:700;letter-spacing:0.02em">EMD DESTOCK</span>`;
  const cta = opts.cta
    ? `<a href="${esc(opts.cta.url)}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#0A0A0A;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none">${esc(opts.cta.label)}</a>`
    : '';
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:40px;background:#F4F4F3;color:#0A0A0A;font-family:Geist,-apple-system,'Helvetica Neue',Arial,sans-serif">
<div style="max-width:560px;margin:0 auto">
<div style="background:#FFFFFF;border-radius:16px;padding:32px">
<div style="margin-bottom:24px">${brand}</div>
<h1 style="margin:0 0 16px;font-size:24px;line-height:30px;font-weight:600;letter-spacing:-0.02em">${esc(opts.title)}</h1>
<div style="font-size:15px;line-height:22px;color:#3F3F3F;margin-bottom:24px">${opts.body}</div>
${cta}
</div>
<p style="margin:20px 4px 0;font-size:12px;line-height:17px;color:#6B6B6B">${esc(opts.footer)}</p>
</div></body></html>`;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (Deno.env.get('EMAIL_DRY_RUN') === '1') {
    console.log(`[dry-run] e-mail à ${to} : ${subject}`);
    return;
  }
  const key = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM');
  if (!key || !from) throw new Error('RESEND_API_KEY et EMAIL_FROM sont requis');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status} : ${await res.text()}`);
}
