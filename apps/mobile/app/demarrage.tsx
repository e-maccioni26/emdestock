import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Package, ShieldCheck, Store, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens, type PlaceholderShape } from '@emd/shared';
import { BottleShape } from '@/components/BottleShape';
import { Text } from '@/components/Text';

const c = tokens.color;
const s = c.splash;
const W = tokens.layout.mobile.width;
const GUTTER = tokens.layout.mobile.gutter;
const SPLASH_MS = 2400;
// Logo : grand et centré pendant l'animation, puis petit en haut à gauche (maquette Demarrage).
const LOGO = { ratio: 641 / 1200, big: 220, small: 76 };
const SCALE = LOGO.small / LOGO.big;

// Le lancement animé ne se joue qu'une fois par session de l'app (pas après une déconnexion).
let played = false;

const FEATURES: { Icon: LucideIcon; label: string }[] = [
  { Icon: Package, label: 'Stock affiché en temps réel' },
  { Icon: Store, label: 'Commande par magasin' },
  { Icon: ShieldCheck, label: 'Comptes validés par EMD' },
];

const BOTTLES: {
  shape: PlaceholderShape;
  height: number;
  left: number;
  top: number;
  stroke: string;
  float: { ms: number; delay: number };
}[] = [
  {
    shape: 'tall',
    height: 264,
    left: 28,
    top: 36,
    stroke: s.bottleFront,
    float: { ms: 7000, delay: 0 },
  },
  {
    shape: 'round',
    height: 220,
    left: 178,
    top: 96,
    stroke: s.bottleMid,
    float: { ms: 8500, delay: 2000 },
  },
  {
    shape: 'tube',
    height: 200,
    left: 300,
    top: 20,
    stroke: s.bottleBack,
    float: { ms: 6500, delay: 4000 },
  },
];

const ease = Easing.bezier(0.2, 0.7, 0.2, 1);

/** Flacon qui flotte (translation verticale en boucle, sur le thread natif), départs décalés. */
function Floating({
  children,
  ms,
  delay,
}: {
  children: React.ReactNode;
  ms: number;
  delay: number;
}) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const half = {
      toValue: 0,
      duration: ms / 2,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    };
    const loop = Animated.loop(
      Animated.sequence([Animated.timing(y, { ...half, toValue: -10 }), Animated.timing(y, half)]),
    );
    const t = setTimeout(() => loop.start(), delay / 4);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [y, ms, delay]);
  return <Animated.View style={{ transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

/** Apparition en glissant vers le haut, échelonnée. */
function Rise({
  delay,
  instant,
  children,
}: {
  delay: number;
  instant: boolean;
  children: React.ReactNode;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: instant ? 0 : 700,
      delay: instant ? 0 : delay,
      easing: ease,
      useNativeDriver: true,
    }).start();
  }, [v, delay, instant]);
  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function Demarrage() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [welcome, setWelcome] = useState(played);
  const [reduceMotion, setReduceMotion] = useState(false);
  const intro = useRef(new Animated.Value(played ? 0 : 1)).current; // 1 = logo centré
  const logoIn = useRef(new Animated.Value(played ? 1 : 0)).current;
  const line = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (played) return;
    Animated.timing(logoIn, {
      toValue: 1,
      duration: 900,
      easing: ease,
      useNativeDriver: true,
    }).start();
    Animated.timing(line, {
      toValue: 1,
      duration: 1600,
      delay: 300,
      easing: Easing.bezier(0.6, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
    const t = setTimeout(() => {
      played = true;
      setWelcome(true);
      Animated.timing(intro, {
        toValue: 0,
        duration: 800,
        easing: Easing.bezier(0.65, 0, 0.25, 1),
        useNativeDriver: true,
      }).start();
    }, SPLASH_MS);
    return () => clearTimeout(t);
  }, [intro, logoIn, line]);

  // Géométrie de la maquette (390 × 844) : le logo part de left 85 / top 343 et arrive à left 20 / top 64.
  const bigH = LOGO.big * LOGO.ratio;
  const startCx = (W - LOGO.big) / 2 + LOGO.big / 2;
  const startCy = (343 / 844) * height + bigH / 2;
  const endCx = GUTTER + LOGO.small / 2;
  const endCy = 64 + (LOGO.small * LOGO.ratio) / 2;
  const dx = endCx - startCx;
  const dy = endCy - startCy;
  // intro 1 → 0 : translation et échelle (centre du logo) de la position centrale vers le coin
  const translateX = intro.interpolate({ inputRange: [0, 1], outputRange: [dx, 0] });
  const translateY = intro.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] });
  const scale = intro.interpolate({ inputRange: [0, 1], outputRange: [SCALE, 1] });

  return (
    <View style={{ flex: 1, backgroundColor: c.ink }}>
      {welcome ? (
        <>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ position: 'absolute', left: 0, right: 0, top: 112, height: 340 }}
          >
            {BOTTLES.map((b) => (
              <View key={b.shape} style={{ position: 'absolute', left: b.left, top: b.top }}>
                {reduceMotion ? (
                  <BottleShape
                    shape={b.shape}
                    height={b.height}
                    stroke={b.stroke}
                    strokeWidth={0.6}
                  />
                ) : (
                  <Floating ms={b.float.ms} delay={b.float.delay}>
                    <BottleShape
                      shape={b.shape}
                      height={b.height}
                      stroke={b.stroke}
                      strokeWidth={0.6}
                    />
                  </Floating>
                )}
              </View>
            ))}
            <View
              style={{
                position: 'absolute',
                left: GUTTER,
                right: GUTTER,
                bottom: 0,
                height: 1,
                backgroundColor: s.rule,
              }}
            />
          </View>

          <View
            style={{
              position: 'absolute',
              left: GUTTER,
              right: GUTTER,
              bottom: Math.max(tokens.layout.mobile.safeBottom, insets.bottom),
              gap: 28,
            }}
          >
            <View style={{ gap: 14 }}>
              <Rise delay={250} instant={reduceMotion}>
                <Text variant="eyebrow" style={{ color: s.eyebrow, letterSpacing: 0.12 * 11 }}>
                  Espace professionnel
                </Text>
              </Rise>
              <Rise delay={330} instant={reduceMotion}>
                <Text
                  accessibilityRole="header"
                  style={{
                    color: c.white,
                    fontFamily: 'Geist-SemiBold',
                    fontSize: 34,
                    lineHeight: 40,
                    letterSpacing: -0.03 * 34,
                  }}
                >
                  {'Le catalogue EMD,\nen direct de l’entrepôt.'}
                </Text>
              </Rise>
              <Rise delay={410} instant={reduceMotion}>
                <Text variant="body" style={{ color: s.body, maxWidth: 320 }}>
                  Consultez les stocks en temps réel et passez commande pour chacun de vos magasins.
                </Text>
              </Rise>
            </View>

            <Rise delay={490} instant={reduceMotion}>
              <View
                style={{
                  flexDirection: 'row',
                  paddingVertical: 16,
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: s.rule,
                }}
              >
                {FEATURES.map(({ Icon, label }, i) => (
                  <View
                    key={label}
                    style={{
                      flex: 1,
                      gap: 8,
                      paddingLeft: i === 0 ? 0 : 12,
                      paddingRight: i === FEATURES.length - 1 ? 0 : 12,
                      borderLeftWidth: i === 0 ? 0 : 1,
                      borderLeftColor: s.rule,
                    }}
                  >
                    <Icon size={20} strokeWidth={1.6} color={c.white} />
                    <Text variant="caption" style={{ color: s.feature }}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </Rise>

            <Rise delay={570} instant={reduceMotion}>
              <View style={{ gap: 12 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/connexion')}
                  style={{
                    height: 52,
                    borderRadius: tokens.radius.card,
                    backgroundColor: c.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: c.ink, fontFamily: 'Geist-SemiBold', fontSize: 15 }}>
                    Se connecter
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/inscription')}
                  style={{
                    height: 52,
                    borderRadius: tokens.radius.card,
                    borderWidth: 1,
                    borderColor: s.outline,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: c.white, fontFamily: 'Geist-SemiBold', fontSize: 15 }}>
                    Demander un accès professionnel
                  </Text>
                </Pressable>
              </View>
            </Rise>
          </View>
        </>
      ) : (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: Math.max(tokens.layout.mobile.safeBottom, insets.bottom),
            alignItems: 'center',
            gap: 16,
          }}
        >
          <View
            style={{
              width: 120,
              height: 2,
              borderRadius: 1,
              backgroundColor: s.rule,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                width: 120,
                height: 2,
                backgroundColor: c.white,
                transform: [
                  { translateX: line.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) },
                  { scaleX: line },
                ],
              }}
            />
          </View>
          <Text variant="eyebrow" style={{ color: s.eyebrow, letterSpacing: 0.12 * 11 }}>
            Votre fournisseur à portée de main
          </Text>
        </View>
      )}

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: (W - LOGO.big) / 2,
          top: (343 / 844) * height,
          width: LOGO.big,
          height: bigH,
          opacity: logoIn,
          transform: [
            { translateX },
            { translateY },
            { scale },
            { scale: logoIn.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          ],
        }}
      >
        <Image
          source={require('../assets/logo-emd-inverse.png')}
          contentFit="contain"
          accessibilityLabel="EMD DESTOCK"
          style={{ width: LOGO.big, height: bigH }}
        />
      </Animated.View>
    </View>
  );
}
