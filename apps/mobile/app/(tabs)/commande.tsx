import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Plus, Store as StoreIcon } from 'lucide-react-native';
import { formatEuro, formatNumber, tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { ProductImage } from '@/components/ProductImage';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useCart } from '@/lib/cart';
import { useCartProducts } from '@/lib/cart-products';
import { useStores } from '@/lib/stores';

const c = tokens.color;
const stepBtn = { width: 40, height: 42, alignItems: 'center', justifyContent: 'center' } as const;

export default function Commande() {
  const { lines, message, lineErrors, setQuantity, remove, setMessage } = useCart();
  const { products, state } = useCartProducts(lines);
  const { stores, active, setActive } = useStores();

  const rows = lines.map((l) => ({ line: l, product: products[l.productId] }));
  const units = rows.reduce((n, r) => n + r.line.quantity, 0);
  const total = rows.reduce(
    (sum, r) => sum + (r.product ? r.line.quantity * r.product.price_ht : 0),
    0,
  );
  // Ligne bloquante : produit masqué/supprimé ou rupture totale signalée par le serveur.
  const blocked = rows.some(
    (r) =>
      (state === 'ready' && !r.product) ||
      lineErrors[r.line.productId]?.available === 0 ||
      r.product?.stock === 0,
  );
  const ready = rows.length > 0 && !!active && !blocked && state === 'ready';

  if (rows.length === 0) {
    return (
      <Screen contentStyle={{ paddingTop: 12, gap: 24 }}>
        <Text variant="screenTitle">Commande</Text>
        <View style={{ alignItems: 'center', gap: 12, paddingTop: 48 }}>
          <Text variant="body" style={{ color: c.textSecondary, textAlign: 'center' }}>
            Votre panier est vide.
          </Text>
          <Button
            label="Parcourir le catalogue"
            variant="secondary"
            compact
            onPress={() => router.navigate('/catalogue')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={{ paddingTop: 12, paddingBottom: 32, gap: 32 }}>
      <View style={{ gap: 4 }}>
        <Text variant="screenTitle">Commande</Text>
        <Text variant="secondary" style={{ color: c.textSecondary, fontVariant: ['tabular-nums'] }}>
          {rows.length} produit{rows.length > 1 ? 's' : ''} · {formatNumber(units)} unité
          {units > 1 ? 's' : ''}
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}
        >
          <Text variant="section">Magasin de livraison</Text>
          <Text style={{ fontSize: 12, fontFamily: 'Geist-Medium', color: c.textSecondary }}>
            Obligatoire
          </Text>
        </View>
        {stores.map((s) => {
          const on = s.id === active?.id;
          return (
            <Pressable
              key={s.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setActive(s.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: tokens.radius.card,
                borderWidth: 1,
                borderColor: on ? c.ink : c.border,
                boxShadow: on ? tokens.shadow.focusRing : undefined,
                backgroundColor: c.white,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: tokens.radius.control,
                  backgroundColor: c.stone,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <StoreIcon size={20} strokeWidth={1.6} color={c.ink} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 15, lineHeight: 20 }}>
                  {s.name}
                </Text>
                <Text variant="secondary" style={{ color: c.textSecondary }}>
                  {s.address}
                </Text>
              </View>
              {on ? (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: c.ink,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={12} strokeWidth={3} color={c.white} />
                </View>
              ) : (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 1.5,
                    borderColor: c.borderStrong,
                  }}
                />
              )}
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/magasin-form')}
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 44,
          }}
        >
          <Plus size={18} strokeWidth={1.8} color={c.ink} />
          <Text style={{ fontFamily: 'Geist-Medium', fontSize: 14 }}>Ajouter un magasin</Text>
        </Pressable>
      </View>

      <View>
        <Text variant="section" style={{ marginBottom: 4 }}>
          Produits
        </Text>
        {rows.map(({ line, product }) => {
          const err = lineErrors[line.productId];
          const gone = state === 'ready' && !product;
          const out = product?.stock === 0 || err?.available === 0;
          return (
            <View
              key={line.productId}
              style={{
                flexDirection: 'row',
                gap: 12,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: c.border,
              }}
            >
              {product ? (
                <ProductImage
                  product={product}
                  title={product.title}
                  dimension={64}
                  radius={tokens.radius.control}
                />
              ) : (
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: tokens.radius.control,
                    backgroundColor: c.stone,
                  }}
                />
              )}
              <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
                <Text variant="cardTitle" numberOfLines={2}>
                  {product?.title ?? (gone ? 'Produit indisponible' : ' ')}
                </Text>
                {product ? (
                  <Text variant="caption" style={{ color: c.textSecondary }}>
                    <Text variant="data" style={{ fontSize: 12, color: c.textSecondary }}>
                      {product.reference}
                    </Text>{' '}
                    · {formatEuro(product.price_ht)} HT / u.
                  </Text>
                ) : null}
                {gone || out ? (
                  <Text variant="secondary" style={{ color: c.error.fg }}>
                    {gone
                      ? 'Ce produit n’est plus disponible.'
                      : 'Plus disponible : retirez-le de la commande.'}
                  </Text>
                ) : err ? (
                  <Text variant="secondary" style={{ color: c.error.fg }}>
                    Stock insuffisant : quantité ajustée à {err.available} (stock restant).
                  </Text>
                ) : null}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 6,
                  }}
                >
                  {gone || out ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Retirer ${product?.title ?? 'ce produit'} de la commande`}
                      onPress={() => remove(line.productId)}
                      style={{ minHeight: 44, justifyContent: 'center' }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Geist-Medium',
                          fontSize: 14,
                          textDecorationLine: 'underline',
                        }}
                      >
                        Retirer
                      </Text>
                    </Pressable>
                  ) : (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        height: 44,
                        borderWidth: 1,
                        borderColor: err ? c.error.fg : c.border,
                        borderRadius: tokens.radius.card,
                      }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Retirer une unité"
                        disabled={line.quantity <= 1}
                        onPress={() => setQuantity(line.productId, line.quantity - 1)}
                        style={[stepBtn, { opacity: line.quantity <= 1 ? 0.3 : 1 }]}
                      >
                        <Text style={{ fontSize: 18 }}>−</Text>
                      </Pressable>
                      <Text
                        accessibilityLabel={`Quantité : ${line.quantity}`}
                        style={{
                          width: 32,
                          textAlign: 'center',
                          fontFamily: 'Geist-SemiBold',
                          fontSize: 14,
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {line.quantity}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Ajouter une unité"
                        disabled={!product || line.quantity >= product.stock}
                        onPress={() => setQuantity(line.productId, line.quantity + 1)}
                        style={[
                          stepBtn,
                          { opacity: !product || line.quantity >= product.stock ? 0.3 : 1 },
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>+</Text>
                      </Pressable>
                    </View>
                  )}
                  {product && !gone && !out ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Retirer ${product.title}`}
                      onPress={() => remove(line.productId)}
                      hitSlop={8}
                      style={{
                        minHeight: 44,
                        minWidth: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        variant="secondary"
                        style={{ color: c.textSecondary, textDecorationLine: 'underline' }}
                      >
                        Retirer
                      </Text>
                    </Pressable>
                  ) : null}
                  <Text
                    style={{
                      fontFamily: 'Geist-SemiBold',
                      fontSize: 15,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {product ? formatEuro(line.quantity * product.price_ht) : ''}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="section">
          Message{' '}
          <Text style={{ fontSize: 13, fontFamily: 'Geist', color: c.textSecondary }}>
            (facultatif)
          </Text>
        </Text>
        <TextInput
          accessibilityLabel="Message pour EMD DESTOCK"
          multiline
          maxLength={1000}
          value={message}
          onChangeText={setMessage}
          placeholder="Précisions de livraison, demande particulière…"
          placeholderTextColor={c.textSecondary}
          style={{
            height: 96,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: tokens.radius.card,
            fontFamily: 'Geist',
            fontSize: 15,
            lineHeight: 22,
            color: c.ink,
            textAlignVertical: 'top',
          }}
        />
        <Text
          variant="caption"
          style={{ color: c.textSecondary, alignSelf: 'flex-end', fontVariant: ['tabular-nums'] }}
        >
          {message.length} / 1 000
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        <View
          style={{
            gap: 8,
            padding: 16,
            borderRadius: tokens.radius.block,
            backgroundColor: c.stone,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontFamily: 'Geist-Medium', fontSize: 15 }}>Total estimé</Text>
            <Text
              style={{
                fontFamily: 'Geist-SemiBold',
                fontSize: 20,
                lineHeight: 26,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatEuro(total)}{' '}
              <Text style={{ fontSize: 13, fontFamily: 'Geist-Medium', color: c.textSecondary }}>
                HT
              </Text>
            </Text>
          </View>
          <Text variant="secondary" style={{ color: c.textSecondary }}>
            Aucun paiement en ligne. Votre commande est transmise à EMD DESTOCK comme une demande,
            le règlement se fait ensuite directement avec eux.
          </Text>
        </View>
        <Button
          label="Vérifier la commande"
          disabled={!ready}
          onPress={() => router.push('/recap')}
        />
        {!active ? (
          <Text variant="secondary" style={{ color: c.textSecondary, textAlign: 'center' }}>
            Sélectionnez un magasin de livraison pour continuer.
          </Text>
        ) : blocked ? (
          <Text variant="secondary" style={{ color: c.textSecondary, textAlign: 'center' }}>
            Retirez les produits indisponibles pour continuer.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
