import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { BANNER_IMAGES_BUCKET } from '@emd/shared';
import { requireAdmin } from '@/lib/auth';

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png' };

// Upload de l'image de fond d'un encart (JPG ou PNG, 5 Mo max). Renvoie le chemin dans le bucket.
export async function POST(req: Request) {
  const { supabase } = await requireAdmin();
  const file = (await req.formData()).get('file');
  if (!(file instanceof File))
    return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext)
    return NextResponse.json(
      { error: 'Format non pris en charge : JPG ou PNG uniquement.' },
      { status: 415 },
    );
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: 'Fichier trop lourd : 5 Mo maximum.' }, { status: 413 });
  const path = `${randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BANNER_IMAGES_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) return NextResponse.json({ error: 'Envoi impossible.' }, { status: 500 });
  return NextResponse.json({ path });
}
