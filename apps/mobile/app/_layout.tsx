import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from '@/lib/cart';
import { CatalogProvider } from '@/lib/catalog';
import { SessionProvider, useSession } from '@/lib/session';
import { StoreProvider } from '@/lib/stores';

SplashScreen.preventAutoHideAsync();

function Routes() {
  const { ready, access } = useSession();
  if (!ready) return null;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={access === null}>
        <Stack.Screen name="connexion" />
        <Stack.Screen name="inscription" />
        <Stack.Screen name="mot-de-passe-oublie" />
      </Stack.Protected>
      {/* Connecté sans demande (inscription interrompue) : reprise du formulaire. */}
      <Stack.Protected guard={access === 'none'}>
        <Stack.Screen name="inscription-a-terminer" />
      </Stack.Protected>
      <Stack.Protected guard={access === 'pending'}>
        <Stack.Screen name="en-attente" />
      </Stack.Protected>
      <Stack.Protected guard={access === 'suspended'}>
        <Stack.Screen name="acces-suspendu" />
      </Stack.Protected>
      <Stack.Protected guard={access === 'active'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="produit/[id]" />
        <Stack.Screen name="magasin" options={{ presentation: 'modal' }} />
        <Stack.Screen name="filtres" options={{ presentation: 'modal' }} />
        <Stack.Screen name="magasin-form" options={{ presentation: 'modal' }} />
        <Stack.Screen name="recap" />
        <Stack.Screen name="confirmation" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      {/* Lien e-mail de récupération : accessible connecté ou non. */}
      <Stack.Screen name="nouveau-mot-de-passe" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Geist: require('geist/dist/fonts/geist-sans/Geist-Regular.ttf'),
    'Geist-Medium': require('geist/dist/fonts/geist-sans/Geist-Medium.ttf'),
    'Geist-SemiBold': require('geist/dist/fonts/geist-sans/Geist-SemiBold.ttf'),
    'Geist-Bold': require('geist/dist/fonts/geist-sans/Geist-Bold.ttf'),
    GeistMono: require('geist/dist/fonts/geist-mono/GeistMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SessionProvider>
        <StoreProvider>
          <CartProvider>
            <CatalogProvider>
              <Routes />
            </CatalogProvider>
          </CartProvider>
        </StoreProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
