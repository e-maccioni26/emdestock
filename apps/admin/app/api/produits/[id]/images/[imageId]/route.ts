import { NextResponse } from 'next/server';
import { PRODUCT_IMAGES_BUCKET } from '@emd/shared';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  const { id, imageId } = await params;
  const { supabase } = await requireAdmin();
  const { data: image } = await supabase
    .from('product_images')
    .select('path, thumb_path')
    .eq('id', imageId)
    .eq('product_id', id)
    .maybeSingle();
  if (!image) return NextResponse.json({ error: 'Photo introuvable.' }, { status: 404 });

  const { error } = await supabase.from('product_images').delete().eq('id', imageId);
  if (error) return NextResponse.json({ error: 'Suppression impossible.' }, { status: 500 });
  await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([image.path, ...(image.thumb_path ? [image.thumb_path] : [])]);

  // Repositionne les photos restantes de 0 à n-1 (la première sert de vignette).
  const { data: rest } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', id)
    .order('position');
  if (rest?.length)
    await supabase.rpc('reorder_product_images', { p_product: id, p_ids: rest.map((r) => r.id) });
  return NextResponse.json({ ok: true });
}
