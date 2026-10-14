'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import type { PlaceholderShape } from '@emd/shared';
import { useConfirm } from '@/components/ConfirmDialog';
import { ProductImage } from '@/components/ProductImage';

export interface Photo {
  id: string;
  path: string;
  thumb_path: string | null;
  position: number;
}

export function PhotoManager({
  productId,
  photos,
  shape,
  title,
}: {
  productId: string;
  photos: Photo[];
  shape: PlaceholderShape;
  title: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const api = `/api/produits/${productId}/images`;
  const as = (p: Photo) => ({
    placeholder_shape: shape,
    product_images: [{ path: p.path, thumb_path: p.thumb_path, position: 0 }],
  });

  async function call(run: () => Promise<Response>) {
    setBusy(true);
    setError(undefined);
    const res = await run();
    if (!res.ok)
      setError(
        ((await res.json().catch(() => null)) as { error?: string } | null)?.error ??
          'Action impossible.',
      );
    setBusy(false);
    router.refresh();
  }
  const upload = (files: FileList | null) =>
    files &&
    Array.from(files).reduce(
      (p, f) =>
        p.then(() =>
          call(() => {
            const fd = new FormData();
            fd.append('file', f);
            return fetch(api, { method: 'POST', body: fd });
          }),
        ),
      Promise.resolve(),
    );
  const move = (i: number, d: -1 | 1) => {
    const ids = photos.map((p) => p.id);
    [ids[i], ids[i + d]] = [ids[i + d]!, ids[i]!];
    return call(() =>
      fetch(api, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      }),
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <ProductImage
        product={photos[0] ? as(photos[0]) : { placeholder_shape: shape }}
        title={title || 'Photo principale'}
        size="full"
        dimension={200}
        className="!w-full"
      />
      <div className="grid grid-cols-4 gap-2">
        {photos.map((p, i) => (
          <div
            key={p.id}
            className={`relative rounded-control ${i === 0 ? 'ring-2 ring-ink' : ''}`}
          >
            <ProductImage
              product={as(p)}
              title={`Photo ${i + 1}`}
              dimension={64}
              className="!w-full"
            />
            <button
              type="button"
              aria-label={`Supprimer la photo ${i + 1}`}
              disabled={busy}
              onClick={async () =>
                (await confirm({
                  title: 'Supprimer cette photo ?',
                  confirmLabel: 'Supprimer',
                  destructive: true,
                })) && call(() => fetch(`${api}/${p.id}`, { method: 'DELETE' }))
              }
              className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border border-border bg-white"
            >
              <X size={14} strokeWidth={2} aria-hidden />
            </button>
            <div className="mt-1 flex justify-center gap-1">
              <button
                type="button"
                aria-label={`Déplacer la photo ${i + 1} vers la gauche`}
                disabled={busy || i === 0}
                onClick={() => move(i, -1)}
                className="flex size-6 items-center justify-center rounded text-text-secondary disabled:opacity-30"
              >
                <ArrowLeft size={14} aria-hidden />
              </button>
              <button
                type="button"
                aria-label={`Déplacer la photo ${i + 1} vers la droite`}
                disabled={busy || i === photos.length - 1}
                onClick={() => move(i, 1)}
                className="flex size-6 items-center justify-center rounded text-text-secondary disabled:opacity-30"
              >
                <ArrowRight size={14} aria-hidden />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          aria-label="Ajouter une photo"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="flex h-16 items-center justify-center rounded-control border-[1.5px] border-dashed border-border-strong bg-white text-text-secondary"
        >
          <Plus size={20} strokeWidth={1.6} aria-hidden />
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        hidden
        onChange={(e) => {
          upload(e.target.files);
          e.target.value = '';
        }}
      />
      {error && (
        <span role="alert" className="text-[13px] text-error">
          {error}
        </span>
      )}
      <span className="text-[12px] text-text-secondary">
        JPG ou PNG, carré, 1 500 px conseillés, 5 Mo maximum. La première photo sert de vignette.
      </span>
    </div>
  );
}
