import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { tokens } from '@emd/shared';
import { FONT, Text } from './Text';

type Props = TextInputProps & { label: string; error?: string; mono?: boolean };

export function Field({ label, error, mono, onFocus, onBlur, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const c = tokens.color;
  const borderColor = error ? c.error.fg : focused ? c.ink : c.border;
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.textSecondary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={{
          height: tokens.size.mobile.input,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor,
          borderRadius: tokens.radius.card,
          backgroundColor: c.white,
          color: c.ink,
          fontFamily: mono ? FONT.mono : FONT[400],
          fontSize: tokens.type.mobile.body.size,
          // anneau de focus 1 px (tokens.shadow.focusRing)
          boxShadow: focused && !error ? tokens.shadow.focusRing : undefined,
        }}
        {...props}
      />
      {error ? (
        <Text variant="secondary" style={{ color: c.error.fg }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
