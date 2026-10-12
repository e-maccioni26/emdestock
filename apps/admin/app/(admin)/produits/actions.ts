'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isValidEan13 } from '@emd/shared';
import { requireAdmin } from '@/lib/auth';

export interface ProductFormState {
  errors?: Record<string, string>;
  formError?: string;
  saved?: boolean;
}

const num = (v: FormDataEntryValue | null) =>
  String(v ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.');

export async function saveProduct(
  id: string | null,
  _prev: ProductFormState,
  form: FormData,
): Promise<ProductFormState> {
  const { supabase } = await requireAdmin();
  const str = (k: string) => String(form.get(k) ?? '').trim();
  const errors: Record<string, string> = {};

  const title = str('title');
  const reference = str('reference');
  const ean = str('ean').replace(/\s/g, '');
  const body = str('body');
  const price = Number(num(form.get('price_ht')));
  const stock = Number(num(form.get('stock')));
  const weightRaw = num(form.get('weight_kg'));
  const weight = weightRaw === '' ? null : Number(weightRaw);

  if (!title) errors.title = 'Titre requis.';
  if (!reference) errors.reference = 'Référence requise.';
  if (!/^\d{13}$/.test(ean)) errors.ean = 'Le code EAN doit contenir 13 chiffres.';
  else if (!isValidEan13(ean)) errors.ean = 'Clé de contrôle EAN invalide.';
  if (body.length > 1000) errors.body = '1 000 caractères maximum.';
  if (num(form.get('price_ht')) === '' || !Number.isFinite(price) || price < 0)
    errors.price_ht = 'Prix invalide.';
  if (num(form.get('stock')) === '' || !Number.isInteger(stock) || stock < 0)
    errors.stock = 'Entier positif ou nul.';
  if (weight !== null && (!Number.isFinite(weight) || weight < 0))
    errors.weight_kg = 'Poids invalide.';
  if (Object.keys(errors).length) return { errors };

  const row = {
    title,
    reference,
    ean,
    brand_id: str('brand_id') || null,
    category_id: str('category_id') || null,
    description: str('description') || null,
    body: body || null,
    price_ht: Math.round(price * 100) / 100,
    weight_kg: weight,
    stock,
    is_visible: form.get('is_visible') === 'on',
    placeholder_shape: str('placeholder_shape') as 'tall' | 'round' | 'tube',
  };
  const { data, error } = id
    ? await supabase.from('products').update(row).eq('id', id).select('id').single()
    : await supabase.from('products').insert(row).select('id').single();

  if (error) {
    if (error.code === '23505') {
      return error.message.includes('ean')
        ? { errors: { ean: 'Ce code EAN existe déjà.' } }
        : { errors: { reference: 'Cette référence existe déjà.' } };
    }
    return { formError: 'L’enregistrement a échoué. Réessayez.' };
  }
  revalidatePath('/produits');
  if (!id) redirect(`/produits/${data.id}`);
  return { saved: true };
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    return {
      error:
        error.message === 'product_in_order'
          ? 'Ce produit figure dans une commande : il ne peut pas être supprimé. Masquez-le du catalogue à la place.'
          : 'La suppression a échoué. Réessayez.',
    };
  }
  revalidatePath('/produits');
  redirect('/produits');
}

export async function setVisibility(id: string, visible: boolean): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('products').update({ is_visible: visible }).eq('id', id);
  if (error) return { error: 'Modification impossible.' };
  revalidatePath('/produits');
  return {};
}

export async function createBrand(
  name: string,
): Promise<{ id?: string; name?: string; error?: string }> {
  const { supabase } = await requireAdmin();
  const clean = name.trim();
  if (!clean) return { error: 'Nom requis.' };
  const { data, error } = await supabase
    .from('brands')
    .insert({ name: clean })
    .select('id, name')
    .single();
  if (error)
    return { error: error.code === '23505' ? 'Cette marque existe déjà.' : 'Création impossible.' };
  return data;
}

export async function createCategory(
  name: string,
  parentId: string | null,
): Promise<{ id?: string; label?: string; error?: string }> {
  const { supabase } = await requireAdmin();
  const clean = name.trim();
  if (!clean) return { error: 'Nom requis.' };
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: clean, parent_id: parentId })
    .select('id, name')
    .single();
  if (error)
    return {
      error: error.code === '23505' ? 'Cette catégorie existe déjà.' : 'Création impossible.',
    };
  return { id: data.id, label: data.name };
}
