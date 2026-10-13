import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { tokens } from '@emd/shared';
import { Text } from '@/components/Text';

interface ToastOptions {
  message: string;
  /** Lien d'action à droite (ex. « Voir »). */
  action?: { label: string; onPress: () => void };
}
const ToastContext = createContext<(t: ToastOptions) => void>(() => {});
export const useToast = () => useContext(ToastContext);

const VISIBLE_MS = 3200;

/** Message bref en haut de l'écran (au-dessus de la barre d'état), annoncé aux lecteurs d'écran. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<(ToastOptions & { key: number }) | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(
      ({ finished }) => finished && setToast(null),
    );
  }, [opacity]);

  const show = useCallback(
    (t: ToastOptions) => {
      clearTimeout(timer.current);
      setToast({ ...t, key: Date.now() });
      AccessibilityInfo.announceForAccessibility(t.message);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(hide, VISIBLE_MS);
    },
    [hide, opacity],
  );
  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => show, [show]);
  const c = tokens.color;
  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: insets.top + 8,
            left: tokens.layout.mobile.gutter,
            right: tokens.layout.mobile.gutter,
            opacity,
            transform: [
              { translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) },
            ],
            zIndex: 1000,
          }}
        >
          <View
            accessibilityLiveRegion="polite"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 52,
              paddingLeft: 16,
              paddingRight: toast.action ? 4 : 16,
              borderRadius: tokens.radius.card,
              backgroundColor: c.ink,
            }}
          >
            <Check size={20} strokeWidth={2} color={c.white} />
            <Text
              variant="body"
              style={{ flex: 1, color: c.white, fontFamily: 'Geist-Medium', paddingVertical: 12 }}
            >
              {toast.message}
            </Text>
            {toast.action ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  clearTimeout(timer.current);
                  setToast(null);
                  toast.action!.onPress();
                }}
                style={{
                  minHeight: 44,
                  minWidth: 44,
                  paddingHorizontal: 12,
                  justifyContent: 'center',
                }}
              >
                <Text variant="body" style={{ color: c.white, fontFamily: 'Geist-SemiBold' }}>
                  {toast.action.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}
