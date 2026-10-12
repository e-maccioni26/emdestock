import {
  PLACEHOLDER_SVG,
  getBannerImageUrl,
  tokens,
  type BannerTheme,
  type PlaceholderShape,
} from '@emd/shared';

export interface PreviewBanner {
  theme: BannerTheme;
  eyebrow: string;
  title: string;
  cta_label: string;
  image_path: string | null;
  shape: PlaceholderShape;
}

/** Aperçu de l'accueil d'un client sans commande (maquette AdminEncarts), avec l'encart en cours d'édition. */
export function BannerPreview({ banner: b, count }: { banner: PreviewBanner; count: number }) {
  const t = tokens.bannerTheme[b.theme];
  const url = getBannerImageUrl(b.image_path, process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
  const light = url ? tokens.bannerTheme.encre : t;
  const s = PLACEHOLDER_SVG[b.shape];
  const h = b.shape === 'tall' ? 120 : 116;
  return (
    <div
      className="flex h-[620px] w-[320px] flex-col gap-[18px] overflow-hidden rounded-[44px] border-8 border-ink bg-white px-5 pt-10"
      aria-label="Aperçu de l’accueil de l’app"
    >
      <div className="flex items-center justify-between">
        <img
          src="/logo-emd.jpg"
          alt=""
          width={52}
          height={30}
          className="h-[30px] w-[52px] object-contain object-left"
        />
        <span className="inline-flex h-8 items-center rounded-full border border-border px-2.5 text-[11px]">
          Parfumerie Wilson
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[22px] leading-7 font-semibold tracking-[-0.02em]">
          Bienvenue Camille
        </span>
        <span className="text-[12px] text-text-secondary">
          Votre compte est activé, le catalogue est à vous.
        </span>
      </div>
      <div
        className="relative -mr-10 flex h-[150px] flex-col justify-between overflow-hidden rounded-[14px] border p-4"
        style={{ background: t.bg, borderColor: t.border, color: light.fg }}
      >
        {url ? (
          <>
            <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-0" style={{ background: 'rgba(10,10,10,0.38)' }} />
          </>
        ) : (
          <svg
            className="absolute right-[52px] -bottom-3"
            width={(s.width / s.height) * h}
            height={h}
            viewBox={s.viewBox}
            fill="none"
            stroke={t.stroke}
            strokeWidth={1.1}
            strokeLinejoin="round"
            aria-hidden
          >
            {s.shapes.map((p, i) => {
              const { tag, ...attrs } = p;
              const Tag = tag as 'rect';
              return <Tag key={i} {...attrs} />;
            })}
          </svg>
        )}
        <div className="relative z-10 flex max-w-[170px] flex-col gap-1">
          <span
            className="text-[10px] font-medium tracking-[0.06em] uppercase"
            style={{ color: light.muted }}
          >
            {b.eyebrow || 'Surtitre'}
          </span>
          <span className="text-[16px] leading-[21px] font-semibold tracking-[-0.01em]">
            {b.title || 'Titre de l’encart'}
          </span>
        </div>
        <span
          className="relative z-10 inline-flex h-[30px] items-center self-start rounded-full px-3 text-[12px] font-semibold"
          style={{ background: light.buttonBg, color: light.buttonFg }}
        >
          {b.cta_label || 'Bouton'}
        </span>
      </div>
      <div className="flex justify-center gap-1.5" aria-hidden>
        <span className="h-1.5 w-[18px] rounded-full bg-ink" />
        {Array.from({ length: Math.max(count - 1, 2) }).map((_, i) => (
          <span
            key={i}
            className="size-1.5 rounded-full"
            style={{ background: tokens.color.dotInactive }}
          />
        ))}
      </div>
      <span className="text-[15px] font-semibold">Les plus commandés</span>
      <div className="flex gap-2.5">
        <span className="size-[110px] rounded-card bg-stone" />
        <span className="size-[110px] rounded-card bg-stone" />
        <span className="h-[110px] w-10 rounded-l-card bg-stone" />
      </div>
    </div>
  );
}
