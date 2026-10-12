import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { tokens } from '@emd/shared';

type Variant = keyof typeof tokens.type.mobile;

export const FONT = {
  400: 'Geist',
  500: 'Geist-Medium',
  600: 'Geist-SemiBold',
  700: 'Geist-Bold',
  mono: 'GeistMono',
} as const;

type Spec = {
  size: number;
  line?: number;
  weight?: number;
  tracking?: string;
  family?: string;
  transform?: string;
  numeric?: string;
  activeWeight?: number;
};

/** Style typographique issu de tokens.type.mobile (letterSpacing converti d'em en px). */
export function typeStyle(variant: Variant): TextStyle {
  const t = tokens.type.mobile[variant] as Spec;
  const family = t.family === 'mono' ? FONT.mono : FONT[(t.weight ?? 400) as 400 | 500 | 600];
  return {
    fontFamily: family,
    fontSize: t.size,
    lineHeight: t.line,
    letterSpacing: t.tracking ? parseFloat(t.tracking) * t.size : undefined,
    textTransform: t.transform as 'uppercase' | undefined,
    fontVariant: t.numeric ? ['tabular-nums'] : undefined,
  };
}

export function Text({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  return <RNText style={[{ color: tokens.color.ink }, typeStyle(variant), style]} {...props} />;
}
