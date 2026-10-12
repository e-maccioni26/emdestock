import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { TextLink } from '@/components/Link';
import { Logo } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { supabase } from '@/lib/supabase';

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(undefined);
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setError('E-mail ou mot de passe incorrect.');
    } else {
      // Un compte administrateur n'a pas accès à l'app client.
      const { data: p } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();
      if (p?.role === 'admin') {
        await supabase.auth.signOut();
        setError('Ce compte n’a pas accès à l’application.');
      }
    }
    setBusy(false);
  }

  return (
    <Screen
      footer={
        <View style={{ gap: 16, paddingBottom: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: tokens.color.border }} />
            <Text variant="secondary" style={{ color: tokens.color.textSecondary }}>
              Pas encore de compte ?
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: tokens.color.border }} />
          </View>
          <Button
            label="Demander un accès professionnel"
            variant="secondary"
            onPress={() => router.push('/inscription')}
          />
          <Text
            variant="caption"
            style={{ color: tokens.color.textSecondary, textAlign: 'center' }}
          >
            Accès réservé aux professionnels validés par EMD DESTOCK.
          </Text>
        </View>
      }
    >
      <View style={{ alignItems: 'center', gap: 24, paddingTop: 32 }}>
        <Logo />
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text variant="modalTitle" style={{ textAlign: 'center' }}>
            Espace professionnel
          </Text>
          <Text
            variant="body"
            style={{ color: tokens.color.textSecondary, textAlign: 'center', maxWidth: 300 }}
          >
            Connectez-vous pour consulter le catalogue et passer commande.
          </Text>
        </View>
      </View>
      <View style={{ gap: 16, paddingTop: 40, paddingBottom: 24 }}>
        <Field
          label="E-mail professionnel"
          placeholder="nom@entreprise.fr"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Field
          label="Mot de passe"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          error={error}
        />
        <TextLink
          label="Mot de passe oublié ?"
          align="flex-end"
          onPress={() => router.push('/mot-de-passe-oublie')}
        />
        <Button
          label={busy ? 'Connexion…' : 'Se connecter'}
          disabled={busy || !email || !password}
          onPress={submit}
        />
      </View>
    </Screen>
  );
}
