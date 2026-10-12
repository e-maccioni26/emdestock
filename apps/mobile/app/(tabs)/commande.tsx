import { View } from 'react-native';
import { tokens } from '@emd/shared';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useCart } from '@/lib/cart';

// Provisoire : le panier, la commande et l'envoi arrivent au lot 3.
export default function Commande() {
  const { count } = useCart();
  return (
    <Screen contentStyle={{ paddingTop: 16 }}>
      <View style={{ gap: 8 }}>
        <Text variant="screenTitle">Commande</Text>
        <Text variant="body" style={{ color: tokens.color.textSecondary }}>
          {count === 0
            ? 'Votre panier est vide.'
            : `${count} référence${count > 1 ? 's' : ''} dans votre panier. L’envoi de la commande arrive prochainement.`}
        </Text>
      </View>
    </Screen>
  );
}
