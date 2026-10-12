// Onglets des listes : pastilles défilantes sous 1024 px (maquette AdminMobile), soulignés au-dessus.
export const tabsWrap =
  '-mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:gap-1 lg:border-b lg:border-border lg:px-0';
export const tabClass = (active: boolean) =>
  `inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] whitespace-nowrap lg:-mb-px lg:rounded-none lg:border-0 lg:border-b-2 lg:px-3 lg:text-[14px] ${
    active
      ? 'border-ink bg-ink font-semibold text-white lg:bg-transparent lg:text-ink'
      : 'border-border font-medium text-text-body lg:border-transparent'
  }`;
export const tabCount = (active: boolean) =>
  `text-[12px] font-medium tabular-nums ${active ? 'text-white/70 lg:text-text-secondary' : 'text-text-secondary'}`;
