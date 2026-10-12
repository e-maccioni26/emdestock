import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { tokens, validatePassword } from '@emd/shared';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { supabase } from '@/lib/supabase';

// Lien e-mail Supabase : emd-destock://nouveau-mot-de-passe#access_token=…&refresh_token=…&type=recovery
export default function NouveauMotDePasse() {
  const url = Linking.useURL();
  const [state, setState] = useState<'loading' | 'ready' | 'invalid'>('loading');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!url) return;
    const params = new URLSearchParams(url.split('#')[1] ?? '');
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (params.get('type') !== 'recovery' || !access_token || !refresh_token) {
      supabase.auth.getSession().then(({ data }) => setState(data.session ? 'ready' : 'invalid'));
      return;
    }
    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error: e }) => setState(e ? 'invalid' : 'ready'));
  }, [url]);

  async function submit() {
    const invalid = validatePassword(password);
    if (invalid) return setError(invalid);
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) setError('Le mot de passe n’a pas pu être modifié. Le lien a peut-être expiré.');
    else router.replace('/');
  }

  return (
    <Screen contentStyle={{ gap: 28, paddingTop: 44 }}>
      <View style={{ gap: 8 }}>
        <Text variant="screenTitle">Nouveau mot de passe</Text>
        {state === 'invalid' ? (
          <Text variant="body" style={{ color: tokens.color.textSecondary }}>
            Ce lien est invalide ou a expiré. Demandez un nouveau lien depuis l’écran de connexion.
          </Text>
        ) : null}
      </View>
      {state === 'ready' ? (
        <View style={{ gap: 16 }}>
          <Field
            label="Nouveau mot de passe"
            placeholder="12 caractères minimum"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            error={error}
          />
          <Text variant="caption" style={{ color: tokens.color.textSecondary }}>
            Au moins 12 caractères, dont un chiffre.
          </Text>
          <Button
            label={busy ? 'Enregistrement…' : 'Enregistrer'}
            disabled={busy || !password}
            onPress={submit}
          />
        </View>
      ) : state === 'invalid' ? (
        <Button
          label="Retour à la connexion"
          variant="secondary"
          onPress={() => router.replace('/')}
        />
      ) : null}
    </Screen>
  );
}
