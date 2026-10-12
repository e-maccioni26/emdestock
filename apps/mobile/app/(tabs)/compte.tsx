import { View } from 'react-native';
import { tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useSession } from '@/lib/session';

// Provisoire : l'écran Compte complet arrive au lot 4.
export default function Compte() {
  const { profile, signOut } = useSession();
  return (
    <Screen
      contentStyle={{ paddingTop: 16 }}
      footer={<Button label="Se déconnecter" variant="secondary" onPress={signOut} />}
    >
      <View style={{ gap: 8 }}>
        <Text variant="screenTitle">Compte</Text>
        <Text variant="body" style={{ color: tokens.color.textSecondary }}>
          {profile?.company?.legal_name}
        </Text>
        <Text variant="secondary" style={{ color: tokens.color.textSecondary }}>
          {profile?.email}
        </Text>
      </View>
    </Screen>
  );
}
