import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ShoppingBag } from 'lucide-react-native';
import { formatEuro, tokens } from '@emd/shared';
import type { OrderStatus } from '@emd/shared';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { StatusBadge, StockBadge } from '@/components/Badge';
import { ProductImage } from '@/components/ProductImage';
import { Text } from '@/components/Text';

const statuses: OrderStatus[] = ['received', 'preparing', 'done', 'cancelled'];

export default function Demo() {
  const gutter = tokens.layout.mobile.gutter;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.white }}>
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 28 }}>
        <Text variant="screenTitle">Composants de base</Text>

        <View style={{ gap: 12 }}>
          <Text variant="section">Boutons</Text>
          <Button label="Ajouter à la commande" />
          <Button label="Demander un accès" variant="secondary" />
          <Button label="Vérifier la commande" disabled />
          <Button label="Mot de passe oublié ?" variant="link" />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Search
              size={tokens.icon.size}
              strokeWidth={tokens.icon.stroke}
              color={tokens.color.ink}
              accessibilityLabel="Rechercher"
            />
            <ShoppingBag
              size={tokens.icon.size}
              strokeWidth={tokens.icon.activeStroke}
              color={tokens.color.ink}
              accessibilityLabel="Panier"
            />
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Text variant="section">Champs</Text>
          <Field label="Raison sociale" placeholder="Parfumerie Wilson SAS" />
          <Field
            label="SIRET"
            mono
            defaultValue="909 639 668 0001"
            error="Le SIRET doit contenir 14 chiffres."
          />
        </View>

        <View style={{ gap: 12 }}>
          <Text variant="section">Badges</Text>
          <View style={{ gap: 8 }}>
            {statuses.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <StockBadge stock={142} />
            <StockBadge stock={4} />
            <StockBadge stock={0} />
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Text variant="section">ProductImage</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ProductImage
              product={{ placeholder_shape: 'tall' }}
              title="Flacon haut"
              dimension={100}
            />
            <ProductImage
              product={{ placeholder_shape: 'round' }}
              title="Flacon rond"
              dimension={100}
            />
            <ProductImage
              product={{ placeholder_shape: 'tube' }}
              title="Tube"
              dimension={100}
              out
            />
          </View>
          <Text variant="price">{formatEuro(1126.4)}</Text>
          <Text variant="data">ML-AN-100 · 3760123456784</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
