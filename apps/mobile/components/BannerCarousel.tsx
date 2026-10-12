import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { tokens } from '@emd/shared';
import { BANNER_WIDTH, BannerCard, type Banner } from './BannerCard';

const GAP = 12;
const STEP = BANNER_WIDTH + GAP;
const AUTO_MS = 4500; // SPEC §2

/** Carrousel d'encarts : défilement automatique toutes les 4,5 s, interrompu au toucher ; l'encart suivant dépasse à droite. */
export function BannerCarousel({
  banners,
  onOpen,
}: {
  banners: Banner[];
  onOpen: (b: Banner) => void;
}) {
  const list = useRef<FlatList<Banner>>(null);
  const [index, setIndex] = useState(0);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched || banners.length < 2) return;
    const t = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % banners.length;
        list.current?.scrollToOffset({ offset: next * STEP, animated: true });
        return next;
      });
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [touched, banners.length]);

  const goTo = (i: number) => {
    setTouched(true);
    setIndex(i);
    list.current?.scrollToOffset({ offset: i * STEP, animated: true });
  };

  return (
    <View accessibilityLabel="À la une" style={{ gap: 4 }}>
      <FlatList
        ref={list}
        data={banners}
        horizontal
        keyExtractor={(b) => b.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={STEP}
        decelerationRate="fast"
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        contentContainerStyle={{ paddingHorizontal: tokens.layout.mobile.gutter }}
        style={{ marginHorizontal: -tokens.layout.mobile.gutter }}
        onScrollBeginDrag={() => setTouched(true)}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / STEP))}
        renderItem={({ item }) => <BannerCard banner={item} onPress={() => onOpen(item)} />}
      />
      {banners.length > 1 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {banners.map((b, i) => (
            <Pressable
              key={b.id}
              accessibilityRole="button"
              accessibilityLabel={`Afficher l’encart ${i + 1}`}
              onPress={() => goTo(i)}
              style={{ width: 22, height: 32, alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{
                  width: i === index ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === index ? tokens.color.ink : tokens.color.dotInactive,
                }}
              />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
