import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { tokens } from '@emd/shared';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useStores } from '@/lib/stores';

// Feuille modale : magasin actif (présélectionné à la commande, SPEC §2).
export default function Magasin() {
  const { stores, active, setActive } = useStores();
  const c = tokens.color;
  return (
    <Screen contentStyle={{ gap: 20, paddingTop: 24, paddingBottom: 24 }}>
      <Text variant="modalTitle">Magasin de livraison</Text>
      {stores.length === 0 ? (
        <Text variant="body" style={{ color: c.textSecondary }}>
          Aucun magasin n’est rattaché à votre compte.
        </Text>
      ) : null}
      <View style={{ gap: 12 }}>
        {stores.map((s) => {
          const on = s.id === active?.id;
          return (
            <Pressable
              key={s.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => {
                setActive(s.id);
                router.back();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                borderRadius: tokens.radius.card,
                borderWidth: 1,
                borderColor: on ? c.ink : c.border,
                boxShadow: on ? tokens.shadow.focusRing : undefined,
                backgroundColor: c.white,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="section">{s.name}</Text>
                <Text variant="secondary" style={{ color: c.textSecondary }}>
                  {s.address}, {s.postal_code} {s.city}
                </Text>
              </View>
              {on ? (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: c.ink,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={12} strokeWidth={3} color={c.white} />
                </View>
              ) : (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 1.5,
                    borderColor: c.borderStrong,
                  }}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
