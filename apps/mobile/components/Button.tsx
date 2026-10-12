import { Pressable, type PressableProps } from 'react-native';
import { tokens } from '@emd/shared';
import { FONT } from './Text';
import { Text } from 'react-native';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'link';
  compact?: boolean;
};

export function Button({ label, variant = 'primary', compact, disabled, ...props }: Props) {
  const c = tokens.color;
  const height =
    variant === 'link'
      ? tokens.size.mobile.buttonCompact
      : compact
        ? tokens.size.mobile.buttonCompact
        : tokens.size.mobile.button;
  const bg = disabled
    ? c.disabledBg
    : variant === 'primary'
      ? c.ink
      : variant === 'secondary'
        ? c.white
        : 'transparent';
  const fg = disabled ? c.disabledText : variant === 'primary' ? c.white : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={{
        height,
        minHeight: tokens.layout.mobile.touchMin,
        borderRadius: tokens.radius.card,
        backgroundColor: bg,
        borderWidth: variant === 'secondary' && !disabled ? 1 : 0,
        borderColor: c.borderStrong,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      {...props}
    >
      <Text
        style={{
          fontFamily: variant === 'link' ? FONT[500] : FONT[600],
          fontSize: tokens.type.mobile.body.size,
          color: fg,
          textDecorationLine: variant === 'link' ? 'underline' : 'none',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
