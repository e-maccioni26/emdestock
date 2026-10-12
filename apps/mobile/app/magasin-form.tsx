import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { confirmAction } from '@/lib/confirm';
import { useSession } from '@/lib/session';
import { useStores } from '@/lib/stores';
import { supabase } from '@/lib/supabase';

// Feuille modale : ajout (sans paramètre) ou modification d'un magasin. Suppression si aucune commande, sinon archivage (SPEC §2).
export default function MagasinForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { profile } = useSession();
  const { stores, reload, setActive } = useStores();
  const [v, setV] = useState({ name: '', address: '', postal_code: '', city: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (t: string) => setV((p) => ({ ...p, [k]: t }));

  useEffect(() => {
    const s = stores.find((x) => x.id === id);
    if (s) setV({ name: s.name, address: s.address, postal_code: s.postal_code, city: s.city });
  }, [id, stores]);

  async function save() {
    const e: Record<string, string> = {};
    if (!v.name.trim()) e.name = 'Champ requis.';
    if (!v.address.trim()) e.address = 'Champ requis.';
    if (!/^\d{5}$/.test(v.postal_code.trim())) e.postal_code = '5 chiffres.';
    if (!v.city.trim()) e.city = 'Champ requis.';
    setErrors(e);
    if (Object.keys(e).length || !profile?.company_id) return;
    setBusy(true);
    const row = {
      name: v.name.trim(),
      address: v.address.trim(),
      postal_code: v.postal_code.trim(),
      city: v.city.trim(),
    };
    if (id) {
      const { error } = await supabase.from('stores').update(row).eq('id', id);
      setBusy(false);
      if (error) return setFormError('L’enregistrement a échoué. Réessayez.');
    } else {
      const { data, error } = await supabase
        .from('stores')
        .insert({ company_id: profile.company_id, ...row })
        .select('id')
        .single();
      setBusy(false);
      if (error) return setFormError('L’ajout a échoué. Réessayez.');
      await reload();
      setActive(data.id);
      return router.back();
    }
    await reload();
    router.back();
  }

  async function remove() {
    if (!id) return;
    const ok = await confirmAction(
      'Supprimer ce magasin ?',
      'S’il a déjà reçu des commandes, il sera archivé : il disparaîtra de vos listes mais ses commandes resteront dans l’historique.',
      'Supprimer',
    );
    if (!ok) return;
    setBusy(true);
    const { error } = await supabase.rpc('remove_store', { p_store: id });
    setBusy(false);
    if (error)
      return setFormError(
        error.message === 'last_store'
          ? 'Vous devez conserver au moins un magasin.'
          : 'La suppression a échoué. Réessayez.',
      );
    await reload();
    router.back();
  }

  return (
    <Screen
      contentStyle={{ gap: 16, paddingTop: 24, paddingBottom: 24 }}
      footer={
        <>
          <Button
            label={busy ? 'Enregistrement…' : id ? 'Enregistrer' : 'Ajouter le magasin'}
            disabled={busy}
            onPress={save}
          />
          {id ? (
            <Button label="Supprimer ce magasin" variant="link" disabled={busy} onPress={remove} />
          ) : null}
        </>
      }
    >
      <Text variant="modalTitle">{id ? 'Modifier le magasin' : 'Ajouter un magasin'}</Text>
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
