import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Pencil, Plus, Store as StoreIcon } from 'lucide-react-native';
import { formatSiret, tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { OrderRow } from '@/components/OrderRow';
import { Screen } from '@/components/Screen';
import { TextLink } from '@/components/Link';
import { FONT, Text } from '@/components/Text';
import { confirmAction } from '@/lib/confirm';
import { useOrders } from '@/lib/orders';
import { useSession } from '@/lib/session';
import { useStores } from '@/lib/stores';
import { supabase } from '@/lib/supabase';

const c = tokens.color;
interface Company {
  legal_name: string;
  siret: string;
  phone: string | null;
  address: string;
  postal_code: string;
  city: string;
}

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      minHeight: 44,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    }}
  >
    <Text style={{ fontSize: 14, color: c.textSecondary }}>{label}</Text>
    <Text
      variant={mono ? 'data' : 'body'}
      style={{ fontSize: mono ? 13 : 14, flexShrink: 1, textAlign: 'right' }}
    >
      {value}
    </Text>
  </View>
);

export default function Compte() {
  const { profile, signOut, refresh } = useSession();
  const { stores, reload: reloadStores } = useStores();
  const { orders, state, reload: reloadOrders } = useOrders(4);
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string>();

  useFocusEffect(
    useCallback(() => {
      reloadStores();
      if (!profile?.company_id) return;
      supabase
        .from('companies')
        .select('legal_name, siret, phone, address, postal_code, city')
        .eq('id', profile.company_id)
        .maybeSingle()
        .then(({ data }) => setCompany(data));
    }, [profile?.company_id, reloadStores]),
  );

  async function deleteAccount() {
    const ok = await confirmAction(
      'Supprimer mon compte ?',
      'Votre accès et vos données personnelles seront définitivement effacés. Vos commandes restent conservées par EMD DESTOCK pour sa comptabilité. Cette action est irréversible.',
      'Supprimer',
    );
    if (!ok) return;
    setError(undefined);
    const { error: err } = await supabase.functions.invoke('delete-account');
    if (err) return setError('La suppression a échoué. Réessayez ou contactez EMD DESTOCK.');
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {}); // l'utilisateur n'existe plus côté serveur
    await refresh();
  }

  const initials =
    `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase();
  return (
    <Screen
      contentStyle={{ paddingTop: 12, paddingBottom: 24, gap: 32 }}
      onRefresh={async () => {
        await Promise.all([reloadOrders(), reloadStores(), refresh()]);
      }}
    >
      <Text variant="screenTitle">Compte</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: -12 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: c.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: c.white, fontFamily: FONT[600], fontSize: 18 }}>{initials}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="section">
            {profile?.first_name} {profile?.last_name}
          </Text>
          <Text variant="secondary" style={{ color: c.textSecondary }}>
            {profile?.company?.legal_name}
          </Text>
          <Text variant="secondary" style={{ color: c.textSecondary }}>
            {profile?.email}
          </Text>
        </View>
      </View>

      <View>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text variant="section">Mes commandes</Text>
          {orders.length > 0 ? (
            <TextLink label="Tout voir" onPress={() => router.push('/mes-commandes')} />
          ) : null}
        </View>
        {state === 'error' ? (
          <View style={{ gap: 8, paddingVertical: 12 }}>
            <Text variant="secondary" style={{ color: c.textSecondary }}>
              Impossible de charger vos commandes.
            </Text>
            <Button label="Réessayer" variant="secondary" compact onPress={reloadOrders} />
          </View>
        ) : state === 'ready' && orders.length === 0 ? (
          <View style={{ gap: 8, paddingVertical: 12 }}>
            <Text variant="secondary" style={{ color: c.textSecondary }}>
              Vous n’avez pas encore passé de commande.
            </Text>
            <Button
              label="Parcourir le catalogue"
              variant="secondary"
              compact
              onPress={() => router.navigate('/catalogue')}
            />
          </View>
        ) : (
          orders.map((o) => <OrderRow key={o.id} order={o} />)
        )}
      </View>

      <View style={{ gap: 12 }}>
        <Text variant="section">Mes magasins</Text>
        {stores.map((s) => (
          <View
            key={s.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 14,
              paddingLeft: 16,
              paddingRight: 4,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: tokens.radius.card,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: tokens.radius.control,
                backgroundColor: c.stone,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StoreIcon size={20} strokeWidth={1.6} color={c.ink} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: FONT[600], fontSize: 15 }}>{s.name}</Text>
              <Text variant="secondary" style={{ color: c.textSecondary }}>
                {s.address}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Modifier ${s.name}`}
              onPress={() => router.push({ pathname: '/magasin-form', params: { id: s.id } })}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Pencil size={18} strokeWidth={1.8} color={c.ink} />
            </Pressable>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/magasin-form')}
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 44,
          }}
        >
          <Plus size={18} strokeWidth={1.8} color={c.ink} />
          <Text style={{ fontFamily: FONT[500], fontSize: 14 }}>Ajouter un magasin</Text>
        </Pressable>
      </View>

      <View>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text variant="section">Entreprise</Text>
          <TextLink label="Modifier" onPress={() => router.push('/compte-form')} />
        </View>
        <Row label="Raison sociale" value={company?.legal_name ?? ' '} />
        <Row label="SIRET" value={company ? formatSiret(company.siret) : ' '} mono />
        <Row label="Téléphone" value={profile ? (company?.phone ?? '—') : ' '} />
        <Row
          label="Siège"
          value={company ? `${company.address}, ${company.postal_code} ${company.city}` : ' '}
        />
      </View>

      <View style={{ gap: 4 }}>
        <Button label="Se déconnecter" variant="secondary" onPress={signOut} />
        {error ? (
          <Text variant="secondary" style={{ color: c.error.fg, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={deleteAccount}
          style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: FONT[500], fontSize: 14, color: c.error.fg }}>
            Supprimer mon compte
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
