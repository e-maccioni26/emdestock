export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex h-[76px] shrink-0 items-center gap-3 border-b border-border pr-[88px] pl-8">
      <div className="flex min-w-0 grow flex-col gap-0.5">
        <h1 className="text-[20px] leading-[26px] font-semibold tracking-[-0.01em]">{title}</h1>
        {subtitle && <p className="text-[13px] leading-[18px] text-text-secondary">{subtitle}</p>}
      </div>
    </header>
  );
}
