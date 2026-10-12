import {
  orderStatusLabel,
  orderStatusTone,
  stockAdminLabel,
  stockLevel,
  tokens,
  toneColors,
} from '@emd/shared';
import type { OrderStatus } from '@emd/shared';

export function StatusBadge({ status }: { status: OrderStatus }) {
  const c = toneColors(orderStatusTone(status));
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      <span className="size-1.5 rounded-full" style={{ background: c.dot }} aria-hidden />
      {orderStatusLabel(status)}
    </span>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  const level = stockLevel(stock);
  const c =
    level === 'out'
      ? { bg: tokens.stock.out.bg, fg: tokens.stock.out.fg }
      : toneColors(tokens.stock[level].tone as 'success' | 'warning');
  return (
    <span
      className="inline-flex h-[22px] items-center rounded-badge px-2 text-[11px] font-semibold tabular-nums"
      style={{ background: c.bg, color: c.fg }}
    >
      {stockAdminLabel(stock)}
    </span>
  );
}
