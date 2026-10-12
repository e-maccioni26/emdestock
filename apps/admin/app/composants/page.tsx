import { Plus, Search } from 'lucide-react';
import { formatEuro } from '@emd/shared';
import type { OrderStatus } from '@emd/shared';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { StatusBadge, StockBadge } from '@/components/Badge';
import { ProductImage } from '@/components/ProductImage';

const statuses: OrderStatus[] = ['received', 'preparing', 'done', 'cancelled'];

export default function Demo() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-8 py-10">
      <h1 className="text-[20px] leading-[26px] font-semibold tracking-[-0.01em]">
        Composants de base
      </h1>

      <section className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold">Boutons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Plus size={20} strokeWidth={1.6} aria-hidden /> Nouveau produit
          </Button>
          <Button variant="secondary">Annuler</Button>
          <Button disabled>Désactivé</Button>
          <Button small>Petit</Button>
          <Button variant="link">Mot de passe oublié ?</Button>
          <Button variant="secondary" aria-label="Rechercher" className="w-10 !px-0">
            <Search size={20} strokeWidth={1.6} aria-hidden />
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <Field label="Nom" placeholder="Parfumerie Wilson SAS" />
        <Field label="E-mail" defaultValue="contact@parfumerie-wilson.fr" />
        <Field
          label="SIRET"
          mono
          defaultValue="909 639 668 0001"
          error="Le SIRET doit contenir 14 chiffres."
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold">Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          {statuses.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
          <StockBadge stock={142} />
          <StockBadge stock={4} />
          <StockBadge stock={0} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[16px] font-semibold">ProductImage (visuel de remplacement)</h2>
        <div className="flex items-center gap-4">
          {(['tall', 'round', 'tube'] as const).map((shape) => (
            <div key={shape} className="flex items-center gap-3">
              <ProductImage product={{ placeholder_shape: shape }} title={`Flacon ${shape}`} />
              <ProductImage
                product={{ placeholder_shape: shape }}
                title={`Flacon ${shape}`}
                dimension={120}
              />
            </div>
          ))}
          <span className="tabular-nums">{formatEuro(1126.4)}</span>
        </div>
      </section>
    </main>
  );
}
