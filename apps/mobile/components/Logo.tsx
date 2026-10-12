import { Image } from 'expo-image';

export function Logo({ width = 168, height = 98 }: { width?: number; height?: number }) {
  return (
    <Image
      source={require('../assets/logo-emd.jpg')}
      contentFit="contain"
      accessibilityLabel="EMD DESTOCK"
      style={{ width, height }}
    />
  );
}
