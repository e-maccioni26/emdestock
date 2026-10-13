import { useEffect, useState } from 'react';
import { FlatList, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  clampQuantity,
  formatEuro,
  stockLabel,
  stockLevel,
  tokens,
  toneColors,
  type PlaceholderShape,
} from '@emd/shared';
import { Button } from '@/components/Button';
import { ProductImage } from '@/components/ProductImage';
import { QuantityStepper } from '@/components/QuantityStepper';
import { Text } from '@/components/Text';
import { PRODUCT_COLUMNS } from '@/lib/catalog';
import { useCart } from '@/lib/cart';
import { useToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  reference: string;
  ean: string;
  title: string;
  description: string | null;
  body: string | null;
  price_ht: number;
  weight_kg: number | null;
  stock: number;
  placeholder_shape: PlaceholderShape;
  brands: { name: string } | null;
  product_images: { path: string; thumb_path: string | null; position: number }[];
}

const HERO = 340;
const row = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 44,
  borderBottomWidth: 1,
  borderBottomColor: tokens.color.border,
} as const;

export default function ProduitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const slideWidth = Math.min(width, tokens.layout.mobile.width);
  const { add, lines } = useCart();
  const toast = useToast();
  const [p, setP] = useState<Product | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [qty, setQty] = useState(1);
  const [page, setPage] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setState('loading');
    supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('id', id)
      .maybeSingle()
      .overrideTypes<Product | null, { merge: false }>()
      .then(({ data, error }) => {
        if (error) return setState('error');
        if (!data) return setState('missing');
        setP(data);
        setQty((q) => clampQuantity(q, data.stock));
        setState('ready');
      });
  }, [id]);

  const bottom = Platform.OS === 'web' ? tokens.layout.mobile.safeBottom : insets.bottom;
  const top = Platform.OS === 'web' ? tokens.layout.mobile.safeTop : insets.top;
  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Retour au catalogue"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/catalogue'))}
      style={{
        position: 'absolute',
        top,
        left: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: tokens.color.white,
        borderWidth: 1,
        borderColor: tokens.color.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ChevronLeft size={22} strokeWidth={2} color={tokens.color.ink} />
    </Pressable>
  );

  if (state !== 'ready' || !p) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.color.white }}>
        <View style={{ height: HERO, backgroundColor: tokens.color.stone }} />
        {back}
        <View style={{ padding: tokens.layout.mobile.gutter, gap: 12 }}>
          {state === 'loading' ? (
            [60, 100, 40].map((w, i) => (
              <View
                key={i}
                style={{
                  width: `${w}%`,
                  height: 18,
                  borderRadius: 4,
                  backgroundColor: tokens.color.stone,
                }}
              />
            ))
          ) : (
            <>
              <Text variant="body" style={{ color: tokens.color.textSecondary }}>
                {state === 'missing'
                  ? 'Ce produit n’est plus disponible.'
                  : 'Impossible de charger ce produit. Vérifiez votre connexion.'}
              </Text>
              <Button
                label={state === 'missing' ? 'Retour au catalogue' : 'Réessayer'}
                variant="secondary"
                compact
                onPress={() =>
                  state === 'missing'
                    ? router.replace('/catalogue')
                    : router.replace({ pathname: '/produit/[id]', params: { id } })
                }
              />
            </>
          )}
        </View>
      </View>
    );
  }

  const level = stockLevel(p.stock);
  const out = level === 'out';
  const tone = out
    ? { fg: tokens.stock.out.fg, bg: tokens.stock.out.bg, dot: tokens.stock.out.fg }
    : toneColors(tokens.stock[level].tone as 'success' | 'warning');
  const photos = [...p.product_images].sort((a, b) => a.position - b.position);
  const slides = photos.length ? photos : [null];
  const total = qty * p.price_ht;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.white }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 + bottom }}>
        <View style={{ height: HERO, backgroundColor: tokens.color.stone }}>
          <FlatList
            data={slides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) =>
              setPage(Math.round(e.nativeEvent.contentOffset.x / slideWidth))
            }
            renderItem={({ item }) => (
              <View
                style={{
                  width: slideWidth,
                  height: HERO,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: 40,
                }}
              >
                <ProductImage
                  product={{
                    placeholder_shape: p.placeholder_shape,
                    product_images: item ? [{ ...item, position: 0 }] : [],
                  }}
                  title={p.title}
                  size="full"
                  dimension={HERO - 40}
                  radius={0}
                  out={out}
                />
              </View>
            )}
          />
          {slides.length > 1 ? (
            <View
              style={{
                position: 'absolute',
                bottom: 16,
                left: 0,
                right: 0,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
              accessibilityLabel={`Photo ${page + 1} sur ${slides.length}`}
            >
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === page ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === page ? tokens.color.ink : tokens.color.dotInactive,
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>
        {back}

        <View style={{ paddingHorizontal: tokens.layout.mobile.gutter, paddingTop: 24, gap: 20 }}>
          <View style={{ gap: 8 }}>
            <Text variant="eyebrow" style={{ color: tokens.color.textSecondary }}>
              {p.brands?.name ?? ' '}
            </Text>
            <Text variant="productTitle">{p.title}</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 4,
              }}
            >
              <Text variant="price">
                {formatEuro(p.price_ht)}{' '}
                <Text
                  style={{
                    fontFamily: 'Geist-Medium',
                    fontSize: 13,
                    color: tokens.color.textSecondary,
                  }}
                >
                  HT / unité
                </Text>
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  height: 24,
                  paddingHorizontal: 10,
                  borderRadius: tokens.radius.pill,
                  backgroundColor: tone.bg,
                }}
              >
                {out ? null : (
                  <View
                    style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tone.dot }}
                  />
                )}
                <Text
                  style={{
                    fontFamily: 'Geist-SemiBold',
                    fontSize: 12,
                    color: tone.fg,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {stockLabel(p.stock)}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: tokens.color.border }}>
            <View style={row}>
              <Text style={{ fontSize: 14, color: tokens.color.textSecondary }}>Référence</Text>
              <Text variant="data">{p.reference}</Text>
            </View>
            <View style={row}>
              <Text style={{ fontSize: 14, color: tokens.color.textSecondary }}>Code EAN</Text>
              <Text variant="data">{p.ean}</Text>
            </View>
            {p.weight_kg !== null ? (
              <View style={row}>
                <Text style={{ fontSize: 14, color: tokens.color.textSecondary }}>Poids</Text>
                <Text style={{ fontSize: 14, fontVariant: ['tabular-nums'] }}>
                  {new Intl.NumberFormat('fr-FR').format(p.weight_kg)} kg
                </Text>
              </View>
            ) : null}
          </View>

          {p.description || p.body ? (
            <View style={{ gap: 8 }}>
              <Text variant="section">Description</Text>
              {p.description ? (
                <Text variant="body" style={{ color: tokens.color.textBody }}>
                  {p.description}
                </Text>
              ) : null}
              {p.body ? (
                <Text variant="body" style={{ color: tokens.color.textBody }}>
                  {p.body}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          gap: 12,
          paddingTop: 12,
          paddingHorizontal: tokens.layout.mobile.gutter,
          paddingBottom: bottom,
          backgroundColor: tokens.color.white,
          borderTopWidth: 1,
          borderTopColor: tokens.color.border,
        }}
      >
        <QuantityStepper value={qty} max={Math.max(p.stock, 1)} onChange={setQty} disabled={out} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: out }}
          disabled={out}
          onPress={() => {
            // la quantité cumulée est plafonnée au stock : annoncer ce qui a réellement été ajouté
            const inCart = lines.find((l) => l.productId === p.id)?.quantity ?? 0;
            const gained = Math.min(inCart + qty, Math.max(p.stock, 1)) - inCart;
            add(p.id, qty, p.stock);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
            toast({
              message:
                gained === 0
                  ? 'Stock maximum déjà dans votre commande'
                  : gained === 1
                    ? '1 article ajouté à votre commande'
                    : `${gained} articles ajoutés à votre commande`,
              action: { label: 'Voir', onPress: () => router.navigate('/commande') },
            });
          }}
          style={{
            flex: 1,
            height: 52,
            borderRadius: tokens.radius.card,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: out ? tokens.color.disabledBg : tokens.color.ink,
          }}
        >
          <Text
            style={{
              fontFamily: 'Geist-SemiBold',
              fontSize: 15,
              lineHeight: 20,
              color: out ? tokens.color.disabledText : tokens.color.white,
            }}
          >
            {out ? 'Rupture de stock' : added ? 'Ajouté à la commande' : 'Ajouter à la commande'}
          </Text>
          {out ? null : (
            <Text
              style={{
                fontSize: 12,
                lineHeight: 16,
                color: tokens.color.onInkMuted,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatEuro(total)} HT
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
