import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import {
  formatDayMonth,
  formatEuro,
  formatNumber,
  orderStatusLabel,
  orderStatusTone,
  tokens,
  toneColors,
} from '@emd/shared';
import { Banner } from '@/components/BannerCard';
import { BannerCarousel } from '@/components/BannerCarousel';
import { Button } from '@/components/Button';
import { ProductMini } from '@/components/ProductMini';
import { Screen } from '@/components/Screen';
import { StoreHeader } from '@/components/StoreHeader';
import { FONT, Text } from '@/components/Text';
import { TextLink } from '@/components/Link';
import { openBanner } from '@/lib/banner-nav';
import { useCatalog } from '@/lib/catalog';
import { useHome } from '@/lib/home';
import { useSession } from '@/lib/session';

const c = tokens.color;
const GUTTER = tokens.layout.mobile.gutter;

export default function Accueil() {
  const { profile } = useSession();
  const { setFilters } = useCatalog();
  const { data, state, reload } = useHome();

  const first = profile?.first_name ?? '';
  const welcome = data && !data.hasOrdered;
  const o = data?.lastOrder;
  const tone = o ? toneColors(orderStatusTone(o.status)) : null;

  return (
    <Screen contentStyle={{ paddingTop: 0, paddingBottom: 32, gap: 24 }} onRefresh={reload}>
      <StoreHeader />
      <View style={{ gap: 4 }}>
        <Text variant="screenTitle">{welcome ? `Bienvenue ${first}` : `Bonjour ${first}`}</Text>
        <Text variant="secondary" style={{ color: c.textSecondary }}>
          {welcome
            ? 'Votre compte est activé, le catalogue est à vous.'
            : profile?.company?.legal_name}
        </Text>
      </View>

      {state === 'error' && !data ? (
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
          <Text variant="body" style={{ color: c.textSecondary, textAlign: 'center' }}>
            Impossible de charger l’accueil. Vérifiez votre connexion.
          </Text>
          <Button label="Réessayer" variant="secondary" compact onPress={reload} />
        </View>
      ) : !data ? (
        <View style={{ gap: 24 }}>
          <View
            style={{ height: 168, borderRadius: tokens.radius.block, backgroundColor: c.stone }}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: tokens.radius.card,
                  backgroundColor: c.stone,
                }}
              />
            ))}
          </View>
        </View>
      ) : (
        <>
          {o && tone ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Dernière commande ${o.number}, ${orderStatusLabel(o.status)}`}
              onPress={() => router.push({ pathname: '/mes-commandes/[id]', params: { id: o.id } })}
              style={{
                gap: 14,
                padding: 16,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: tokens.radius.block,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text variant="eyebrow" style={{ color: c.textSecondary }}>
                  Dernière commande
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
                  <View
                    style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tone.dot }}
                  />
                  <Text style={{ fontFamily: FONT[600], fontSize: 12, color: tone.fg }}>
                    {orderStatusLabel(o.status)}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ gap: 2, flex: 1 }}>
                  <Text variant="data">{o.number}</Text>
                  <Text variant="secondary" style={{ color: c.textSecondary }} numberOfLines={1}>
                    {formatDayMonth(o.created_at)} · {o.stores?.name} ·{' '}
                    {formatNumber(o.order_items[0]?.count ?? 0)} réf.
                  </Text>
                </View>
                <Text
                  style={{ fontFamily: FONT[600], fontSize: 17, fontVariant: ['tabular-nums'] }}
                >
                  {formatEuro(o.total_ht)}
                </Text>
              </View>
            </Pressable>
          ) : null}

          {data.banners.length > 0 ? (
            <BannerCarousel
              banners={data.banners}
              onOpen={(b: Banner) => openBanner(b, setFilters)}
            />
          ) : null}

          <View style={{ gap: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text variant="section">{data.productsTitle}</Text>
              <TextLink label="Tout voir" onPress={() => router.navigate('/catalogue')} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: GUTTER }}
              style={{ marginHorizontal: -GUTTER }}
            >
              {data.products.map((p) => (
                <ProductMini key={p.id} product={p} />
              ))}
            </ScrollView>
          </View>

          {data.categories.length > 0 ? (
            <View style={{ gap: 12 }}>
              <Text variant="section">Catégories</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {data.categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    accessibilityRole="link"
                    accessibilityLabel={`${cat.name}, ${cat.count} références`}
                    onPress={() => {
                      setFilters({
                        query: '',
                        categoryIds: [cat.id],
                        brandIds: [],
                        availableOnly: false,
                      });
                      router.navigate('/catalogue');
                    }}
                    style={{
                      width: '48%',
                      flexGrow: 1,
                      height: 72,
                      padding: 14,
                      justifyContent: 'space-between',
                      borderRadius: tokens.radius.card,
                      backgroundColor: c.stone,
                    }}
                  >
                    <Text style={{ fontFamily: FONT[600], fontSize: 15 }}>{cat.name}</Text>
                    <Text variant="caption" style={{ color: c.textSecondary }}>
                      {formatNumber(cat.count)} réf.
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}
