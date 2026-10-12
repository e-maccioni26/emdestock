import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { formatNumber, tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { StoreHeader } from '@/components/StoreHeader';
import { ProductCard, type ProductRow } from '@/components/ProductCard';
import { Text } from '@/components/Text';
import { PAGE_SIZE, PRODUCT_COLUMNS, catalogQuery, useCatalog } from '@/lib/catalog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

const GUTTER = tokens.layout.mobile.gutter;
const GAP = tokens.space[3];

function Skeleton({ width }: { width: number }) {
  const bar = (w: number | string, h: number) => (
    <View
      style={{
        width: w as number,
        height: h,
        borderRadius: 4,
        backgroundColor: tokens.color.stone,
      }}
    />
  );
  return (
    <View style={{ width, gap: 10 }}>
      <View
        style={{
          width,
          height: width,
          borderRadius: tokens.radius.card,
          backgroundColor: tokens.color.stone,
        }}
      />
      {bar('40%', 12)}
      {bar('90%', 14)}
      {bar('50%', 12)}
    </View>
  );
}

export default function Catalogue() {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === 'web' ? tokens.layout.mobile.safeTop : insets.top;
  const cardWidth = (Math.min(screenWidth, tokens.layout.mobile.width) - GUTTER * 2 - GAP) / 2;
  const { filters, setFilters, activeCount, categories } = useCatalog();

  const [text, setText] = useState(filters.query);
  const [items, setItems] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'more'>('loading');
  const request = useRef(0);

  // Recherche différée de 300 ms.
  useEffect(() => {
    if (text === filters.query) return;
    const t = setTimeout(() => setFilters({ ...filters, query: text.trim() }), 300);
    return () => clearTimeout(t);
  }, [text, filters, setFilters]);

  const load = useCallback(
    async (from: number) => {
      const id = ++request.current;
      setState(from === 0 ? 'loading' : 'more');
      const { data, count, error } = await catalogQuery(filters)
        .select(PRODUCT_COLUMNS)
        .order('created_at', { ascending: false }) // nouveautés d'abord (SPEC §2)
        .order('id')
        .range(from, from + PAGE_SIZE - 1)
        .overrideTypes<ProductRow[], { merge: false }>();
      if (id !== request.current) return; // réponse périmée
      if (error) return setState('error');
      setItems((prev) => (from === 0 ? (data ?? []) : [...prev, ...(data ?? [])]));
      setTotal(count);
      setState('ready');
    },
    [filters],
  );
  useEffect(() => {
    load(0);
  }, [load]);

  const topCategories = categories.filter((c) => !c.parent_id).slice(0, 3);
  const hasMore = total !== null && items.length < total;
  const filtered = activeCount > 0 || filters.query !== '';

  const header = (
    <View style={{ paddingTop: top, paddingBottom: 8, gap: 16 }}>
      <StoreHeader />
      <View style={{ gap: 4 }}>
        <Text variant="screenTitle">Catalogue</Text>
        <Text variant="secondary" style={{ color: tokens.color.textSecondary }}>
          {total === null
            ? ' '
            : filtered
              ? `${formatNumber(total)} résultat${total > 1 ? 's' : ''}`
              : `${formatNumber(total)} références disponibles`}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            height: 44,
            paddingHorizontal: 14,
            borderRadius: tokens.radius.card,
            backgroundColor: tokens.color.stone,
          }}
        >
          <Search size={18} strokeWidth={1.8} color={tokens.color.textSecondary} />
          <TextInput
            accessibilityLabel="Rechercher"
            placeholder="Produit, marque, réf. ou EAN"
            placeholderTextColor={tokens.color.textSecondary}
            value={text}
            onChangeText={setText}
            returnKeyType="search"
            autoCorrect={false}
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: 'Geist',
              fontSize: 15,
              color: tokens.color.ink,
            }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            activeCount > 0
              ? `Filtres, ${activeCount} actif${activeCount > 1 ? 's' : ''}`
              : 'Filtres'
          }
          onPress={() => router.push('/filtres')}
          style={{
            width: 44,
            height: 44,
            borderWidth: 1,
            borderColor: activeCount > 0 ? tokens.color.ink : tokens.color.border,
            borderRadius: tokens.radius.card,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SlidersHorizontal size={20} strokeWidth={1.8} color={tokens.color.ink} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: GUTTER }}
        style={{ marginHorizontal: -GUTTER }}
      >
        <Chip
          label="Tous"
          selected={activeCount === 0}
          onPress={() =>
            setFilters({ ...filters, categoryIds: [], brandIds: [], availableOnly: false })
          }
        />
        {topCategories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            selected={filters.categoryIds.length === 1 && filters.categoryIds[0] === c.id}
            onPress={() =>
              setFilters({
                ...filters,
                categoryIds:
                  filters.categoryIds[0] === c.id && filters.categoryIds.length === 1 ? [] : [c.id],
              })
            }
          />
        ))}
        <Chip
          label="Disponibles"
          selected={filters.availableOnly}
          onPress={() => setFilters({ ...filters, availableOnly: !filters.availableOnly })}
        />
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.white }}>
      <FlatList
        data={state === 'loading' ? [] : items}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: GUTTER }}
        contentContainerStyle={{ rowGap: 24, paddingBottom: 32 }}
        ListHeaderComponent={<View style={{ paddingHorizontal: GUTTER }}>{header}</View>}
        renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
        keyboardShouldPersistTaps="handled"
        onEndReachedThreshold={0.6}
        onEndReached={() => hasMore && state === 'ready' && load(items.length)}
        refreshing={false}
        onRefresh={() => load(0)}
        ListEmptyComponent={
          state === 'loading' ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: GAP,
                paddingHorizontal: GUTTER,
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} width={cardWidth} />
              ))}
            </View>
          ) : state === 'error' ? (
            <View style={{ alignItems: 'center', gap: 12, padding: GUTTER }}>
              <Text
                variant="body"
                style={{ color: tokens.color.textSecondary, textAlign: 'center' }}
              >
                Impossible de charger le catalogue. Vérifiez votre connexion.
              </Text>
              <Button label="Réessayer" variant="secondary" compact onPress={() => load(0)} />
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: 12, padding: GUTTER }}>
              <Text
                variant="body"
                style={{ color: tokens.color.textSecondary, textAlign: 'center' }}
              >
                Aucun produit ne correspond à votre recherche.
              </Text>
              {filtered ? (
                <Button
                  label="Effacer la recherche et les filtres"
                  variant="secondary"
                  compact
                  onPress={() => {
                    setText('');
                    setFilters({ query: '', categoryIds: [], brandIds: [], availableOnly: false });
                  }}
                />
              ) : null}
            </View>
          )
        }
        ListFooterComponent={
          state === 'more' ? (
            <ActivityIndicator style={{ marginTop: 8 }} color={tokens.color.ink} />
          ) : null
        }
      />
    </View>
  );
}
