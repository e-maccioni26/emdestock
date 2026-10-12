import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { accessState, type AccessState } from '@emd/shared';
import { supabase } from './supabase';

export interface Profile {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  company_id: string | null;
  company: { legal_name: string; siret: string; status: string } | null;
}

interface SessionValue {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  /** null tant que l'utilisateur n'est pas connecté ; 'none' : connecté sans demande (inscription à terminer). */
  access: AccessState | 'none' | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SessionValue | null>(null);

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, role, company_id, companies(legal_name, siret, status)')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;
  const { companies, ...rest } = data;
  return { ...rest, company: companies };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setProfile(data.session ? await loadProfile(data.session.user.id) : null);
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setProfile(null);
      // jamais d'appel Supabase directement dans le callback (interblocage) : on diffère
      else setTimeout(() => loadProfile(next.user.id).then(setProfile), 0);
    });
    // Le statut de l'entreprise peut changer côté admin : on relit au retour sur l'app.
    const app = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      sub.subscription.unsubscribe();
      app.remove();
    };
  }, [refresh]);

  const value = useMemo<SessionValue>(
    () => ({
      ready,
      session,
      profile,
      access: !session
        ? null
        : profile
          ? accessState({ role: profile.role, company_status: profile.company?.status ?? null })
          : 'none',
      refresh,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [ready, session, profile, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession hors SessionProvider');
  return v;
};
