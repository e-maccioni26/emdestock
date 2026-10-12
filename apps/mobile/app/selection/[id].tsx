import { useEffect, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { ProductCard, type ProductRow } from '@/components/ProductCard';
import { Text } from '@/components/Text';
import { PRODUCT_COLUMNS } from '@/lib/catalog';
import { supabase } from '@/lib/supabase';

const GUTTER = tokens.layout.mobile.gutter;
const GAP = tokens.space[3];

// Catalogue filtré sur la sélection de produits d'un encart ; le titre de l'encart sert d'en-tête (SPEC §2).
export default function Selection() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === 'web' ? tokens.layout.mobile.safeTop : insets.top;
  const cardWidth = (Math.min(width, tokens.layout.mobile.width) - GUTTER * 2 - GAP) / 2;
  const [items, setItems] = useState<ProductRow[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  async function load() {
    setState('loading');
    const { data: links, error } = await supabase
      .from('banner_products')
      .select('product_id')
      .eq('banner_id', id);
    if (error) return setState('error');
    const ids = (links ?? []).map((l) => l.product_id);
    if (ids.length === 0) {
      setItems([]);
      return setState('ready');
    }
    const { data, error: e2 } = await supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .in('id', ids)
      .order('created_at', { ascending: false })
      .overrideTypes<ProductRow[], { merge: false }>();
    if (e2) return setState('error');
    setItems(data ?? []); // les produits masqués ne sont pas renvoyés (RLS)
    setState('ready');
  }
  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.white }}>
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: GUTTER }}
        contentContainerStyle={{ rowGap: 24, paddingBottom: 32 }}
        renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
        ListHeaderComponent={
          <View style={{ paddingTop: top, paddingHorizontal: GUTTER, paddingBottom: 16, gap: 8 }}>
            <View style={{ height: 44, justifyContent: 'center' }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retour"
                onPress={() => router.back()}
                style={{
                  width: 44,
                  height: 44,
                  marginLeft: -12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={22} strokeWidth={2} color={tokens.color.ink} />
              </Pressable>
            </View>
            <Text variant="screenTitle">{title ?? 'Sélection'}</Text>
            <Text variant="secondary" style={{ color: tokens.color.textSecondary }}>
              {state === 'ready' ? `${items.length} produit${items.length > 1 ? 's' : ''}` : ' '}
            </Text>
          </View>
        }
        ListEmptyComponent={
          state === 'error' ? (
            <View style={{ alignItems: 'center', gap: 12, padding: GUTTER }}>
              <Text
                variant="body"
                style={{ color: tokens.color.textSecondary, textAlign: 'center' }}
              >
                Impossible de charger la sélection.
              </Text>
              <Button label="Réessayer" variant="secondary" compact onPress={load} />
            </View>
          ) : state === 'ready' ? (
            <View style={{ padding: GUTTER }}>
              <Text
                variant="body"
                style={{ color: tokens.color.textSecondary, textAlign: 'center' }}
              >
                Aucun produit disponible dans cette sélection.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
