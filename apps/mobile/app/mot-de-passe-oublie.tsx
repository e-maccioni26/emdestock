import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { ChevronLeft } from 'lucide-react-native';
import { tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { supabase } from '@/lib/supabase';

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(undefined);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL('/nouveau-mot-de-passe'),
    });
    setBusy(false);
    // Réponse identique que l'adresse existe ou non (pas d'énumération de comptes).
    if (err && err.status !== 400) setError('Envoi impossible pour le moment. Réessayez.');
    else setSent(true);
  }

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
        <Text variant="screenTitle">Mot de passe oublié</Text>
        <Text variant="body" style={{ color: tokens.color.textSecondary }}>
          Saisissez votre e-mail professionnel. Nous vous enverrons un lien pour choisir un nouveau
          mot de passe.
        </Text>
      </View>
      {sent ? (
        <View
          style={{
            padding: 14,
            borderRadius: tokens.radius.card,
            backgroundColor: tokens.color.success.bg,
            gap: 2,
          }}
        >
          <Text
            variant="secondary"
            style={{ color: tokens.color.success.fg, fontFamily: 'Geist-SemiBold' }}
          >
            E-mail envoyé
          </Text>
          <Text variant="secondary" style={{ color: tokens.color.textBody }}>
            Si un compte existe pour cette adresse, vous allez recevoir un lien dans quelques
            instants.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Field
            label="E-mail professionnel"
            placeholder="nom@entreprise.fr"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={error}
          />
          <Button
            label={busy ? 'Envoi…' : 'Envoyer le lien'}
            disabled={busy || !email.includes('@')}
            onPress={submit}
          />
        </View>
      )}
    </Screen>
  );
}
