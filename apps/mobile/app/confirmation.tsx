import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { formatEuro, formatNumber, tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/Badge';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';

const c = tokens.color;

function Row({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.border,
      }}
    >
      <Text style={{ fontSize: 14, color: c.textSecondary }}>{label}</Text>
      {children}
    </View>
  );
}

export default function Confirmation() {
  const p = useLocalSearchParams<{
    number: string;
    store: string;
    refs: string;
    units: string;
    total: string;
  }>();
  const units = Number(p.units);
  return (
    <Screen
      contentStyle={{ paddingTop: 64 }}
      footer={
        <>
          <Button label="Suivre ma commande" onPress={() => router.replace('/compte')} />
          <Button
            label="Retour au catalogue"
            variant="secondary"
            onPress={() => router.replace('/catalogue')}
          />
        </>
      }
    >
      <View style={{ alignItems: 'center', gap: 20 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: c.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={32} strokeWidth={2.2} color={c.white} />
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text variant="modalTitle" style={{ textAlign: 'center' }}>
            Commande envoyée
          </Text>
          <Text variant="data" style={{ color: c.textSecondary }}>
            {p.number}
          </Text>
          <Text
            variant="body"
            style={{ color: c.textSecondary, textAlign: 'center', maxWidth: 310 }}
          >
            EMD DESTOCK a bien reçu votre demande. Suivez son statut depuis votre compte.
          </Text>
        </View>
      </View>
      <View
        style={{
          marginTop: 40,
          paddingHorizontal: 16,
          paddingVertical: 4,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: tokens.radius.block,
        }}
      >
        <Row label="Magasin">
          <Text style={{ fontFamily: 'Geist-Medium', fontSize: 14 }}>{p.store}</Text>
        </Row>
        <Row label="Produits">
          <Text style={{ fontFamily: 'Geist-Medium', fontSize: 14, fontVariant: ['tabular-nums'] }}>
            {p.refs} réf. · {formatNumber(units)} unité{units > 1 ? 's' : ''}
          </Text>
        </Row>
        <Row label="Total estimé">
          <Text
            style={{ fontFamily: 'Geist-SemiBold', fontSize: 14, fontVariant: ['tabular-nums'] }}
          >
            {formatEuro(Number(p.total))} HT
          </Text>
        </Row>
        <Row label="Statut" last>
          <StatusBadge status="received" />
        </Row>
      </View>
    </Screen>
  );
}
