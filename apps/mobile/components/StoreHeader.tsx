import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronDown, Store as StoreIcon } from 'lucide-react-native';
import { tokens } from '@emd/shared';
import { Logo } from './Logo';
import { Text } from './Text';
import { useStores } from '@/lib/stores';

/** En-tête de l'accueil et du catalogue : logo et sélecteur de magasin actif. */
export function StoreHeader() {
  const { active } = useStores();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
      }}
    >
      <Logo width={64} height={38} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Magasin actif : ${active?.name ?? 'aucun'}. Changer de magasin`}
        onPress={() => router.push('/magasin')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 44,
          paddingLeft: 14,
          paddingRight: 12,
          borderWidth: 1,
          borderColor: tokens.color.border,
          borderRadius: tokens.radius.pill,
        }}
      >
        <StoreIcon size={16} strokeWidth={1.8} color={tokens.color.ink} />
        <Text style={{ fontFamily: 'Geist-Medium', fontSize: 13 }} numberOfLines={1}>
          {active?.name ?? 'Magasin'}
        </Text>
        <ChevronDown size={14} strokeWidth={2} color={tokens.color.ink} />
      </Pressable>
    </View>
  );
}
