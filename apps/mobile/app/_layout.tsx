import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

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
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
