import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { PRODUCT_IMAGES_BUCKET, tokens } from '@emd/shared';
import { requireAdmin } from '@/lib/auth';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png' };

// Upload d'une photo : original + vignette 400 px (SPEC §6).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: 'Fichier trop lourd : 5 Mo maximum.' }, { status: 413 });

  const original = Buffer.from(await file.arrayBuffer());
  let thumb: Buffer;
  try {
    // Fond Pierre derrière les PNG transparents ; la vignette garde les proportions (ProductImage affiche en contain).
    thumb = await sharp(original)
      .rotate()
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: tokens.color.stone })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'Image illisible.' }, { status: 422 });
  }

  const key = randomUUID();
  const path = `${id}/${key}.${ext}`;
  const thumbPath = `${id}/${key}-400.jpg`;
  const bucket = supabase.storage.from(PRODUCT_IMAGES_BUCKET);
  const up1 = await bucket.upload(path, original, { contentType: file.type });
  const up2 = await bucket.upload(thumbPath, thumb, { contentType: 'image/jpeg' });
  if (up1.error || up2.error) {
    await bucket.remove([path, thumbPath]);
    return NextResponse.json({ error: 'Envoi impossible.' }, { status: 500 });
  }

  const { data: last } = await supabase
    .from('product_images')
    .select('position')
    .eq('product_id', id)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from('product_images')
    .insert({ product_id: id, path, thumb_path: thumbPath, position: (last?.position ?? -1) + 1 })
    .select('id, path, thumb_path, position')
    .single();
  if (error) {
    await bucket.remove([path, thumbPath]);
    return NextResponse.json({ error: 'Enregistrement impossible.' }, { status: 500 });
  }
  return NextResponse.json(data);
}

// Réordonnancement : { ids: [...] } dans le nouvel ordre.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { ids } = (await req.json()) as { ids?: string[] };
  if (!Array.isArray(ids))
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  const { error } = await supabase.rpc('reorder_product_images', { p_product: id, p_ids: ids });
  if (error) return NextResponse.json({ error: 'Réordonnancement impossible.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
