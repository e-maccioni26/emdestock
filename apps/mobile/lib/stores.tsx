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
import { supabase } from './supabase';

export interface Store {
  id: string;
  name: string;
  address: string;
  postal_code: string;
  city: string;
}

interface StoreValue {
  stores: Store[];
  active: Store | null;
  setActive: (id: string) => void;
  reload: () => Promise<void>;
}
const Ctx = createContext<StoreValue | null>(null);

/** Magasins de l'entreprise (hors archivés) et magasin actif, mémorisé par utilisateur. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const { session, access } = useSession();
  const uid = session?.user.id;
  const [stores, setStores] = useState<Store[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!uid || access !== 'active') return setStores([]);
    const { data } = await supabase
      .from('stores')
      .select('id, name, address, postal_code, city')
      .is('archived_at', null)
      .order('created_at');
    setStores(data ?? []);
  }, [uid, access]);

  useEffect(() => {
    reload();
    if (uid)
      AsyncStorage.getItem(`activeStore:${uid}`)
        .then(setActiveId)
        .catch(() => {});
  }, [reload, uid]);

  const value = useMemo<StoreValue>(
    () => ({
      stores,
      active: stores.find((s) => s.id === activeId) ?? stores[0] ?? null,
      setActive: (id) => {
        setActiveId(id);
        if (uid) AsyncStorage.setItem(`activeStore:${uid}`, id).catch(() => {});
      },
      reload,
    }),
    [stores, activeId, uid, reload],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStores = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStores hors StoreProvider');
  return v;
};
