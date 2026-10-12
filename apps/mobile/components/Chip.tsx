import { Pressable } from 'react-native';
import { tokens } from '@emd/shared';
import { FONT, Text } from './Text';

/** Pilule de filtre : zone tactile 44 px, pastille visuelle 34 px (maquette Catalogue). */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const c = tokens.color;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ height: 44, justifyContent: 'center' }}
    >
      <Text
        style={{
          height: 34,
          lineHeight: 32,
          paddingHorizontal: 14,
          borderRadius: tokens.radius.pill,
          borderWidth: 1,
          overflow: 'hidden',
          fontFamily: FONT[500],
          fontSize: 13,
          backgroundColor: selected ? c.ink : c.white,
          color: selected ? c.white : c.ink,
          borderColor: selected ? c.ink : c.border,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
