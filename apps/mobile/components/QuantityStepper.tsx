import { Pressable, View } from 'react-native';
import { tokens } from '@emd/shared';
import { Text } from './Text';

/** Sélecteur de quantité : 52 px de haut, boutons − / + de 44 px (DESIGN.md). */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
}) {
  const btn = { width: 44, height: 50, alignItems: 'center', justifyContent: 'center' } as const;
  const dim = (off: boolean) => ({ opacity: off ? 0.3 : 1 });
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderWidth: 1,
        borderColor: tokens.color.border,
        borderRadius: tokens.radius.card,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retirer une unité"
        disabled={disabled || value <= min}
        onPress={() => onChange(value - 1)}
        style={[btn, dim(!!disabled || value <= min)]}
      >
        <Text style={{ fontSize: 20 }}>−</Text>
      </Pressable>
      <Text
        accessibilityLabel={`Quantité : ${value}`}
        style={{
          width: 36,
          textAlign: 'center',
          fontFamily: 'Geist-SemiBold',
          fontSize: 15,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ajouter une unité"
        disabled={disabled || value >= max}
        onPress={() => onChange(value + 1)}
        style={[btn, dim(!!disabled || value >= max)]}
      >
        <Text style={{ fontSize: 20 }}>+</Text>
      </Pressable>
    </View>
  );
}
