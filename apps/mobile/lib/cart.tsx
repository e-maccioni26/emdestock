import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from './session';

export interface CartLine {
  productId: string;
  quantity: number;
}
interface CartValue {
  lines: CartLine[];
  /** Nombre de références (pastille de l'onglet Commande). */
  count: number;
  add: (productId: string, quantity: number, max: number) => void;
}
const Ctx = createContext<CartValue | null>(null);

/** Panier local, par utilisateur (AsyncStorage). L'écran Commande et l'envoi arrivent au lot 3. */
export function CartProvider({ children }: { children: ReactNode }) {
  const uid = useSession().session?.user.id;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    if (!uid) return setLines([]);
    AsyncStorage.getItem(`cart:${uid}`)
      .then((raw) => setLines(raw ? (JSON.parse(raw) as CartLine[]) : []))
      .catch(() => setLines([]))
      .finally(() => setLoaded(true));
  }, [uid]);

  useEffect(() => {
    if (uid && loaded) AsyncStorage.setItem(`cart:${uid}`, JSON.stringify(lines)).catch(() => {});
  }, [uid, loaded, lines]);

  const value = useMemo<CartValue>(
    () => ({
      lines,
      count: lines.length,
      // La quantité cumulée ne dépasse jamais le stock connu.
      add: (productId, quantity, max) =>
        setLines((prev) => {
          const existing = prev.find((l) => l.productId === productId);
          const total = Math.min((existing?.quantity ?? 0) + quantity, Math.max(max, 1));
          return existing
            ? prev.map((l) => (l.productId === productId ? { ...l, quantity: total } : l))
            : [...prev, { productId, quantity: total }];
        }),
    }),
    [lines],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart hors CartProvider');
  return v;
};
