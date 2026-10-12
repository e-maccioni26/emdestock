import { Tabs } from 'expo-router';
import { Home, LayoutGrid, ShoppingBag, User, type LucideIcon } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@emd/shared';
import { useCart } from '@/lib/cart';

const icon = (Icon: LucideIcon) =>
  function TabIcon({
    color,
    focused,
  }: {
    color: import('react-native').ColorValue;
    focused: boolean;
  }) {
    return (
      <Icon
        size={tokens.icon.size}
        strokeWidth={focused ? tokens.icon.activeStroke : tokens.icon.stroke}
        color={color}
      />
    );
  };

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { count } = useCart();
  const bottom = Platform.OS === 'web' ? tokens.layout.mobile.safeBottom : insets.bottom;
  const c = tokens.color;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.ink,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: {
          height: tokens.layout.mobile.tabBarHeight + 6 + bottom,
          paddingTop: 6,
          paddingBottom: bottom,
          borderTopColor: c.border,
          backgroundColor: c.white,
        },
        tabBarLabelStyle: { fontSize: tokens.type.mobile.tab.size, fontFamily: 'Geist-Medium' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: icon(Home) }} />
      <Tabs.Screen
        name="catalogue"
        options={{ title: 'Catalogue', tabBarIcon: icon(LayoutGrid) }}
      />
      <Tabs.Screen
        name="commande"
        options={{
          title: 'Commande',
          tabBarIcon: icon(ShoppingBag),
          tabBarBadge: count > 0 ? count : undefined,
          // Pastille rouge de marque : un des trois usages autorisés (DESIGN.md).
          tabBarBadgeStyle: {
            backgroundColor: c.brandRed,
            color: c.white,
            fontSize: 11,
            fontFamily: 'Geist-Bold',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
        }}
      />
      <Tabs.Screen name="compte" options={{ title: 'Compte', tabBarIcon: icon(User) }} />
    </Tabs>
  );
}
