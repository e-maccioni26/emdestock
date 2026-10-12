import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { OrderRow } from '@/components/OrderRow';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useOrders } from '@/lib/orders';

// Historique complet des commandes (« Tout voir »), 20 par page.
export default function MesCommandes() {
  const { orders, state, hasMore, reload, more } = useOrders(20);
  return (
    <Screen contentStyle={{ gap: 16, paddingBottom: 24 }} onRefresh={reload}>
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 44 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          style={{
            position: 'absolute',
            left: -12,
            top: 0,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={22} strokeWidth={2} color={tokens.color.ink} />
        </Pressable>
        <Text variant="section">Mes commandes</Text>
      </View>
      {state === 'error' ? (
        <View style={{ gap: 8 }}>
          <Text variant="secondary" style={{ color: tokens.color.textSecondary }}>
            Impossible de charger vos commandes.
          </Text>
          <Button label="Réessayer" variant="secondary" compact onPress={reload} />
        </View>
      ) : state === 'ready' && orders.length === 0 ? (
        <Text variant="body" style={{ color: tokens.color.textSecondary }}>
          Vous n’avez pas encore passé de commande.
        </Text>
      ) : (
        <View>
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </View>
      )}
      {hasMore ? <Button label="Voir plus" variant="secondary" compact onPress={more} /> : null}
    </Screen>
  );
}
