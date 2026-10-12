import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

// Modifier les informations entreprise et contact (le SIRET n'est pas modifiable, SPEC §2).
export default function CompteForm() {
  const { profile, session, refresh } = useSession();
  const [v, setV] = useState({
    legal_name: '',
    address: '',
    postal_code: '',
    city: '',
    phone: '',
    first_name: '',
    last_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (t: string) => setV((p) => ({ ...p, [k]: t }));

  useEffect(() => {
    if (!profile?.company_id) return;
    supabase
      .from('companies')
      .select('legal_name, address, postal_code, city, phone')
      .eq('id', profile.company_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data)
          setV({
            legal_name: data.legal_name,
            address: data.address,
            postal_code: data.postal_code,
            city: data.city,
            phone: data.phone ?? '',
            first_name: profile.first_name,
            last_name: profile.last_name,
          });
      });
  }, [profile]);

  async function save() {
    const e: Record<string, string> = {};
    if (!v.legal_name.trim()) e.legal_name = 'Champ requis.';
    if (!v.address.trim()) e.address = 'Champ requis.';
    if (!/^\d{5}$/.test(v.postal_code.trim())) e.postal_code = '5 chiffres.';
    if (!v.city.trim()) e.city = 'Champ requis.';
    if (!v.first_name.trim()) e.first_name = 'Champ requis.';
    if (!v.last_name.trim()) e.last_name = 'Champ requis.';
    setErrors(e);
    if (Object.keys(e).length || !profile?.company_id || !session) return;
    setBusy(true);
    const phone = v.phone.trim() || null;
    const company = await supabase
      .from('companies')
      .update({
        legal_name: v.legal_name.trim(),
        address: v.address.trim(),
        postal_code: v.postal_code.trim(),
        city: v.city.trim(),
        phone,
      })
      .eq('id', profile.company_id);
    const person = await supabase
      .from('profiles')
      .update({ first_name: v.first_name.trim(), last_name: v.last_name.trim(), phone })
      .eq('id', session.user.id);
    setBusy(false);
    if (company.error || person.error) return setFormError('L’enregistrement a échoué. Réessayez.');
    await refresh();
    router.back();
  }

  return (
    <Screen
      contentStyle={{ gap: 16, paddingTop: 24, paddingBottom: 24 }}
      footer={
        <Button label={busy ? 'Enregistrement…' : 'Enregistrer'} disabled={busy} onPress={save} />
      }
    >
      <Text variant="modalTitle">Mes informations</Text>
      <Text variant="section">Entreprise</Text>
      <Field
        label="Raison sociale"
        value={v.legal_name}
        onChangeText={set('legal_name')}
        error={errors.legal_name}
      />
      <Field
        label="Adresse du siège"
        value={v.address}
        onChangeText={set('address')}
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
      <Text variant="section" style={{ marginTop: 8 }}>
        Contact
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Prénom"
            value={v.first_name}
            onChangeText={set('first_name')}
            error={errors.first_name}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Nom"
            value={v.last_name}
            onChangeText={set('last_name')}
            error={errors.last_name}
          />
        </View>
      </View>
      <Field
        label="Téléphone"
        value={v.phone}
        onChangeText={set('phone')}
        keyboardType="phone-pad"
      />
      <Text variant="caption" style={{ color: tokens.color.textSecondary }}>
        Le SIRET et l’e-mail de connexion ne sont pas modifiables. Contactez EMD DESTOCK pour les
        changer.
      </Text>
      {formError ? (
        <Text variant="secondary" style={{ color: tokens.color.error.fg }}>
          {formError}
        </Text>
      ) : null}
    </Screen>
  );
}
