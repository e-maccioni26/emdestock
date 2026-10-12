import { View } from 'react-native';
import { tokens } from '@emd/shared';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useSession } from '@/lib/session';

// Accueil provisoire : la carte « Dernière commande » et les encarts arrivent au lot 5.
export default function Accueil() {
  const { profile } = useSession();
  return (
    <Screen contentStyle={{ paddingTop: 16 }}>
      <View style={{ gap: 8 }}>
        <Text variant="screenTitle">Bienvenue</Text>
        <Text variant="body" style={{ color: tokens.color.textSecondary }}>
          {profile?.company?.legal_name}
        </Text>
      </View>
    </Screen>
  );
}
