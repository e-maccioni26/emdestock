import { View } from 'react-native';
import { tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { InscriptionForm } from '@/components/InscriptionForm';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useSession } from '@/lib/session';

// Compte créé mais demande d'accès jamais enregistrée (envoi interrompu) : on reprend sans ressaisir e-mail ni mot de passe.
export default function InscriptionATerminer() {
  const { signOut } = useSession();
  return (
    <Screen contentStyle={{ gap: 28, paddingTop: 44 }}>
      <View style={{ gap: 8 }}>
        <Text variant="screenTitle">Terminer ma demande</Text>
        <Text variant="body" style={{ color: tokens.color.textSecondary }}>
          Votre compte est créé. Renseignez votre entreprise pour envoyer la demande d’accès.
        </Text>
      </View>
      <InscriptionForm resume />
      <Button label="Se déconnecter" variant="secondary" onPress={signOut} />
    </Screen>
  );
}
