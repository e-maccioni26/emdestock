import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { ArrowRight } from 'lucide-react-native';
import { getBannerImageUrl, tokens, type BannerTheme, type PlaceholderShape } from '@emd/shared';
import { BottleShape } from './BottleShape';
import { FONT, Text } from './Text';

export interface Banner {
  id: string;
  eyebrow: string;
  title: string;
  cta_label: string;
  theme: BannerTheme;
  image_path: string | null;
  target_type: 'product' | 'category' | 'brand' | 'selection';
  target_id: string | null;
  shape: PlaceholderShape;
}

export const BANNER_WIDTH = 320;
export const BANNER_HEIGHT = 168;

/** Encart du carrousel d'accueil (maquette AccueilNouveau) : fond uni ou image, texte, bouton, flacon au trait. */
export function BannerCard({ banner: b, onPress }: { banner: Banner; onPress: () => void }) {
  const url = getBannerImageUrl(b.image_path, process.env.EXPO_PUBLIC_SUPABASE_URL ?? '');
  const t = tokens.bannerTheme[b.theme];
  // Sur une image, texte clair sur voile sombre quel que soit le thème.
  const light = url ? tokens.bannerTheme.encre : t;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${b.eyebrow}. ${b.title}. ${b.cta_label}`}
      onPress={onPress}
      style={{
        width: BANNER_WIDTH,
        height: BANNER_HEIGHT,
        padding: 20,
        borderRadius: tokens.radius.block,
        overflow: 'hidden',
        justifyContent: 'space-between',
        backgroundColor: t.bg,
        borderWidth: 1,
        borderColor: t.border,
      }}
    >
      {url ? (
        <>
          <Image
            source={{ uri: url }}
            contentFit="cover"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(10,10,10,0.38)',
            }}
          />
        </>
      ) : (
        <View style={{ position: 'absolute', right: 18, bottom: -14 }}>
          <BottleShape
            shape={b.shape}
            height={b.shape === 'tall' ? 138 : 132}
            stroke={t.stroke}
            strokeWidth={1.1}
          />
        </View>
      )}
      <View style={{ gap: 6, maxWidth: 196 }}>
        <Text variant="eyebrow" style={{ color: light.muted }} numberOfLines={1}>
          {b.eyebrow}
        </Text>
        <Text
          style={{
            fontFamily: FONT[600],
            fontSize: 19,
            lineHeight: 24,
            letterSpacing: -0.19,
            color: light.fg,
          }}
          numberOfLines={3}
        >
          {b.title}
        </Text>
      </View>
      <View
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 34,
          paddingHorizontal: 14,
          borderRadius: tokens.radius.pill,
          backgroundColor: light.buttonBg,
        }}
      >
        <Text style={{ fontFamily: FONT[600], fontSize: 13, color: light.buttonFg }}>
          {b.cta_label}
        </Text>
        <ArrowRight size={14} strokeWidth={2} color={light.buttonFg} />
      </View>
    </Pressable>
  );
}
