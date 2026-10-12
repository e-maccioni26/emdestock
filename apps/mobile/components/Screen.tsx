import type { ReactNode } from 'react';
import { Platform, RefreshControl, ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@emd/shared';

type Props = {
  children: ReactNode;
  /** Pied collé en bas de l'écran (boutons d'action). */
  footer?: ReactNode;
  contentStyle?: ViewStyle;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
};

/** Écran mobile : marges latérales 20, zones sûres haute/basse (valeurs des maquettes sur le web). */
export function Screen({ children, footer, contentStyle, onRefresh, refreshing }: Props) {
  const insets = useSafeAreaInsets();
  const L = tokens.layout.mobile;
  const top = Platform.OS === 'web' ? L.safeTop : insets.top;
  const bottom = Platform.OS === 'web' ? L.safeBottom : insets.bottom;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.color.white,
        paddingTop: top,
        paddingBottom: bottom,
      }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[{ flexGrow: 1, paddingHorizontal: L.gutter }, contentStyle]}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
        }
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={{ paddingHorizontal: L.gutter, paddingTop: 8, gap: 8 }}>{footer}</View>
      ) : null}
    </View>
  );
}
