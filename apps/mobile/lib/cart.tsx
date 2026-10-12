import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from './session';

export interface CartLine {
  productId: string;
  quantity: number;
}
/** Ligne refusée par place_order : stock restant (0 = plus disponible). */
export type LineErrors = Record<string, { available: number }>;

interface CartValue {
  lines: CartLine[];
  message: string;
  lineErrors: LineErrors;
  /** Nombre de références (pastille de l'onglet Commande). */
  count: number;
  add: (productId: string, quantity: number, max: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  setMessage: (message: string) => void;
  /** Après un refus de stock : ajuste les quantités au stock restant et signale les lignes. */
  applyStockErrors: (errors: { product_id: string; available: number }[]) => void;
  clear: () => void;
}
const Ctx = createContext<CartValue | null>(null);

interface Persisted {
  lines: CartLine[];
  message: string;
}

/** Panier local, par utilisateur (AsyncStorage) : références, quantités et message. */
export function CartProvider({ children }: { children: ReactNode }) {
  const uid = useSession().session?.user.id;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [message, setMessage] = useState('');
  const [lineErrors, setLineErrors] = useState<LineErrors>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setLineErrors({});
    if (!uid) {
      setLines([]);
      setMessage('');
      return;
    }
    AsyncStorage.getItem(`cart:${uid}`)
      .then((raw) => {
        const p = raw ? (JSON.parse(raw) as Partial<Persisted> | CartLine[]) : null;
        // Ancien format (lot 2) : tableau de lignes.
        setLines(Array.isArray(p) ? p : (p?.lines ?? []));
        setMessage(Array.isArray(p) ? '' : (p?.message ?? ''));
      })
      .catch(() => setLines([]))
      .finally(() => setLoaded(true));
  }, [uid]);

  useEffect(() => {
    if (uid && loaded)
      AsyncStorage.setItem(`cart:${uid}`, JSON.stringify({ lines, message })).catch(() => {});
  }, [uid, loaded, lines, message]);

  const dropError = useCallback(
    (id: string) =>
      setLineErrors((e) =>
        id in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== id)) : e,
      ),
    [],
  );

  const value = useMemo<CartValue>(
    () => ({
      lines,
      message,
      lineErrors,
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
      setQuantity: (productId, quantity) => {
        dropError(productId);
        setLines((prev) =>
          prev.map((l) =>
            l.productId === productId ? { ...l, quantity: Math.max(1, quantity) } : l,
          ),
        );
      },
      remove: (productId) => {
        dropError(productId);
        setLines((prev) => prev.filter((l) => l.productId !== productId));
      },
      setMessage: (m) => setMessage(m.slice(0, 1000)),
      applyStockErrors: (errors) => {
        setLineErrors(
          Object.fromEntries(errors.map((e) => [e.product_id, { available: e.available }])),
        );
        setLines((prev) =>
          prev.map((l) => {
            const e = errors.find((x) => x.product_id === l.productId);
            return e && e.available > 0 ? { ...l, quantity: Math.min(l.quantity, e.available) } : l;
          }),
        );
      },
      clear: () => {
        setLines([]);
        setMessage('');
        setLineErrors({});
      },
    }),
    [lines, message, lineErrors, dropError],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart hors CartProvider');
  return v;
};
