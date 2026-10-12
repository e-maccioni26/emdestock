import { tokens } from './tokens';
import type { Tone } from './stock';

export type OrderStatus = keyof typeof tokens.orderStatus;

export const orderStatusLabel = (status: OrderStatus): string => tokens.orderStatus[status].label;
export const orderStatusTone = (status: OrderStatus): Tone =>
  tokens.orderStatus[status].tone as Tone;

export const toneColors = (tone: Tone): { fg: string; bg: string; dot: string } => {
  const c = tokens.color;
  switch (tone) {
    case 'success':
      return { fg: c.success.fg, bg: c.success.bg, dot: c.success.fg };
    case 'warning':
      return { fg: c.warning.fg, bg: c.warning.bg, dot: c.warning.dot };
    case 'error':
      return { fg: c.error.fg, bg: c.error.bg, dot: c.error.fg };
    default:
      return { fg: c.neutral.fg, bg: c.neutral.bg, dot: c.neutral.dot };
  }
};
