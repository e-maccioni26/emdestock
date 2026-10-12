export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex shrink-0 items-center gap-3 px-5 pt-1 pb-3 md:h-[76px] md:border-b md:border-border md:py-0 md:pr-[88px] md:pl-8">
      <div className="flex min-w-0 grow flex-col gap-0.5">
        <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.02em] md:text-[20px] md:leading-[26px] md:tracking-[-0.01em]">
          {title}
        </h1>
        {subtitle && <p className="text-[13px] leading-[18px] text-text-secondary">{subtitle}</p>}
      </div>
    </header>
  );
}
