import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useSession } from '@/lib/session';
import { useStores } from '@/lib/stores';
import { supabase } from '@/lib/supabase';

// Feuille modale : ajout d'un magasin (la modification et l'archivage arrivent au lot 4, écran Compte).
export default function MagasinForm() {
  const { profile } = useSession();
  const { reload, setActive } = useStores();
  const [v, setV] = useState({ name: '', address: '', postal_code: '', city: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (t: string) => setV((p) => ({ ...p, [k]: t }));

  async function save() {
    const e: Record<string, string> = {};
    if (!v.name.trim()) e.name = 'Champ requis.';
    if (!v.address.trim()) e.address = 'Champ requis.';
    if (!/^\d{5}$/.test(v.postal_code.trim())) e.postal_code = '5 chiffres.';
    if (!v.city.trim()) e.city = 'Champ requis.';
    setErrors(e);
    if (Object.keys(e).length || !profile?.company_id) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('stores')
      .insert({
        company_id: profile.company_id,
        name: v.name.trim(),
        address: v.address.trim(),
        postal_code: v.postal_code.trim(),
        city: v.city.trim(),
      })
      .select('id')
      .single();
    setBusy(false);
    if (error) return setFormError('L’ajout a échoué. Réessayez.');
    await reload();
    setActive(data.id);
    router.back();
  }

  return (
    <Screen
      contentStyle={{ gap: 16, paddingTop: 24, paddingBottom: 24 }}
      footer={
        <Button
          label={busy ? 'Enregistrement…' : 'Ajouter le magasin'}
          disabled={busy}
          onPress={save}
        />
      }
    >
      <Text variant="modalTitle">Ajouter un magasin</Text>
      <Field
        label="Nom du magasin"
        placeholder="Parfumerie Wilson Nord"
        value={v.name}
        onChangeText={set('name')}
        error={errors.name}
      />
      <Field
        label="Adresse"
        value={v.address}
        onChangeText={set('address')}
        autoComplete="street-address"
        error={errors.address}
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 120 }}>
          <Field
            label="Code postal"
            value={v.postal_code}
            onChangeText={set('postal_code')}
            keyboardType="number-pad"
            maxLength={5}
            error={errors.postal_code}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Ville" value={v.city} onChangeText={set('city')} error={errors.city} />
        </View>
      </View>
      {formError ? (
        <Text variant="secondary" style={{ color: tokens.color.error.fg }}>
          {formError}
        </Text>
      ) : null}
    </Screen>
  );
}
