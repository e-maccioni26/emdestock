import { Pressable } from 'react-native';
import { FONT, Text } from './Text';

/** Lien souligné (décalage 3 px dans les maquettes ; non supporté par RN, soulignement simple). */
export function TextLink({
  label,
  onPress,
  align = 'center',
}: {
  label: string;
  onPress: () => void;
  align?: 'center' | 'flex-end';
}) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={{ minHeight: 44, justifyContent: 'center', alignSelf: align }}
    >
      <Text style={{ fontFamily: FONT[500], fontSize: 14, textDecorationLine: 'underline' }}>
        {label}
      </Text>
    </Pressable>
  );
}
