import type { ReactNode } from 'react';
import { Linking, View } from 'react-native';
import { tokens } from '@emd/shared';
import { Button } from './Button';
import { TextLink } from './Link';
import { Screen } from './Screen';
import { Text } from './Text';
import { useSession } from '@/lib/session';

const CONTACT = process.env.EXPO_PUBLIC_CONTACT_EMAIL;

/** Structure commune de « Demande envoyée » et « Accès suspendu » (maquette EnAttente). */
export function StatusScreen({
  icon,
  title,
  text,
  children,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  const { signOut, refresh } = useSession();
  return (
    <Screen
      onRefresh={refresh}
      contentStyle={{ paddingTop: 48 }}
      footer={
        <>
          <Button label="Retour à la connexion" variant="secondary" onPress={signOut} />
          {CONTACT ? (
            <TextLink
              label="Contacter EMD DESTOCK"
              onPress={() => Linking.openURL(`mailto:${CONTACT}`)}
            />
          ) : null}
        </>
      }
    >
      <View style={{ alignItems: 'center', gap: 20 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: tokens.radius.pill,
            backgroundColor: tokens.color.stone,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text variant="modalTitle" style={{ textAlign: 'center' }}>
            {title}
          </Text>
          <Text
            variant="body"
            style={{ color: tokens.color.textSecondary, textAlign: 'center', maxWidth: 310 }}
          >
            {text}
          </Text>
        </View>
      </View>
      {children}
    </Screen>
  );
}
