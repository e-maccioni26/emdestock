import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Store as StoreIcon } from 'lucide-react-native';
import { formatEuro, formatNumber, tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useCart } from '@/lib/cart';
import { useCartProducts } from '@/lib/cart-products';
import { useStores } from '@/lib/stores';
import { supabase } from '@/lib/supabase';

const c = tokens.color;

// Récapitulatif avant envoi. L'envoi passe par la fonction SQL place_order (atomique, stock verrouillé).
export default function Recap() {
  const { lines, message, applyStockErrors, clear } = useCart();
  const { products } = useCartProducts(lines);
  const { active } = useStores();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const rows = lines.flatMap((l) =>
    products[l.productId] ? [{ line: l, product: products[l.productId]! }] : [],
  );
  const units = rows.reduce((n, r) => n + r.line.quantity, 0);
  const total = rows.reduce((s, r) => s + r.line.quantity * r.product.price_ht, 0);

  async function send() {
    if (!active) return;
    setBusy(true);
    setError(undefined);
    const { data, error: err } = await supabase.rpc('place_order', {
      p_store: active.id,
      p_message: message.trim() || (null as unknown as string),
      p_items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity })),
    });
    setBusy(false);
    if (err) {
      if (err.message === 'insufficient_stock') {
        // detail : [{product_id, requested, available}] → on ajuste le panier et on revient signaler les lignes.
        try {
          applyStockErrors(JSON.parse(err.details ?? '[]'));
        } catch {
          /* détail illisible : le retour au panier suffit */
        }
        return router.back();
      }
      return setError(
        err.message === 'company_not_active'
          ? 'Votre accès est suspendu.'
          : 'L’envoi a échoué. Vérifiez votre connexion et réessayez.',
      );
    }
    const order = Array.isArray(data) ? data[0] : data;
    clear();
    router.replace({
      pathname: '/confirmation',
      params: {
        number: order.number,
        store: active.name,
        refs: String(rows.length),
        units: String(order.units),
        total: String(order.total_ht),
      },
    });
  }

  return (
    <Screen
      contentStyle={{ gap: 24, paddingBottom: 24 }}
      footer={
        <>
          {error ? (
            <Text variant="secondary" style={{ color: c.error.fg, textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}
          <Text variant="caption" style={{ color: c.textSecondary, textAlign: 'center' }}>
            Sans paiement en ligne. EMD DESTOCK confirmera la commande.
          </Text>
          <Button
            label={busy ? 'Envoi…' : 'Envoyer la commande'}
            disabled={busy || !active || rows.length === 0}
            onPress={send}
          />
        </>
      }
    >
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 44 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour à la commande"
          onPress={() => router.back()}
          style={{
            position: 'absolute',
            left: -12,
            top: 0,
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={22} strokeWidth={2} color={c.ink} />
        </Pressable>
        <Text variant="section">Récapitulatif</Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: tokens.radius.block,
          backgroundColor: c.stone,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: tokens.radius.control,
            backgroundColor: c.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StoreIcon size={20} strokeWidth={1.6} color={c.ink} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="eyebrow" style={{ color: c.textSecondary }}>
            Livraison
          </Text>
          <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 15 }}>{active?.name}</Text>
          <Text variant="secondary" style={{ color: c.textSecondary }}>
            {active?.address}
          </Text>
        </View>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.back()}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text
            style={{ fontFamily: 'Geist-Medium', fontSize: 14, textDecorationLine: 'underline' }}
          >
            Modifier
          </Text>
        </Pressable>
      </View>

      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            paddingBottom: 4,
          }}
        >
          <Text variant="section">Produits</Text>
          <Text variant="secondary" style={{ color: c.textSecondary }}>
            {rows.length} réf. · {formatNumber(units)} unités
          </Text>
        </View>
        {rows.map(({ line, product }) => (
          <View
            key={line.productId}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="cardTitle">{product.title}</Text>
              <Text
                variant="caption"
                style={{ color: c.textSecondary, fontVariant: ['tabular-nums'] }}
              >
                <Text variant="data" style={{ fontSize: 12, color: c.textSecondary }}>
                  {product.reference}
                </Text>{' '}
                · {line.quantity} × {formatEuro(product.price_ht)}
              </Text>
            </View>
            <Text
              style={{ fontFamily: 'Geist-SemiBold', fontSize: 15, fontVariant: ['tabular-nums'] }}
            >
              {formatEuro(line.quantity * product.price_ht)}
            </Text>
          </View>
        ))}
      </View>

      {message.trim() ? (
        <View style={{ gap: 6 }}>
          <Text style={{ fontFamily: 'Geist-Medium', fontSize: 13, color: c.textSecondary }}>
            Votre message
          </Text>
          <Text variant="body">{message.trim()}</Text>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: c.ink,
        }}
      >
        <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 15 }}>Total estimé</Text>
        <Text variant="price">
          {formatEuro(total)}{' '}
          <Text style={{ fontSize: 13, fontFamily: 'Geist-Medium', color: c.textSecondary }}>
            HT
          </Text>
        </Text>
      </View>
    </Screen>
  );
}
