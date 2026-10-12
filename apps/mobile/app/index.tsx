import { View } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useSession } from '@/lib/session';

// Accueil provisoire du client actif : le catalogue arrive au lot 2.
export default function Home() {
  const { profile, signOut } = useSession();
  return (
    <Screen footer={<Button label="Se déconnecter" variant="secondary" onPress={signOut} />}>
      <View style={{ gap: 8, paddingTop: 48 }}>
        <Text variant="screenTitle">Bienvenue</Text>
        <Text variant="body" style={{ color: '#6B6B6B' }}>
          {profile?.company?.legal_name}
        </Text>
      </View>
    </Screen>
  );
}
