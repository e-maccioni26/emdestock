import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { tokens } from '@emd/shared';
import { InscriptionForm } from '@/components/InscriptionForm';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';

export default function Inscription() {
  return (
    <Screen contentStyle={{ gap: 28 }}>
      <View style={{ height: 44, justifyContent: 'center' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour à la connexion"
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            marginLeft: -12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={22} strokeWidth={2} color={tokens.color.ink} />
        </Pressable>
      </View>
      <View style={{ gap: 8 }}>
        <Text variant="screenTitle">Demander un accès</Text>
        <Text variant="body" style={{ color: tokens.color.textSecondary }}>
          Renseignez votre entreprise. EMD DESTOCK valide chaque demande avant d’ouvrir l’accès au
          catalogue.
        </Text>
      </View>
      <InscriptionForm />
    </Screen>
  );
}
