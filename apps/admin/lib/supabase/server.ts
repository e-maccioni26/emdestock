import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@emd/shared';

// Clé anon + session de l'admin connecté : la RLS s'applique. La clé service_role n'est pas utilisée ici.
export async function createClient() {
  const store = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // appelé depuis un Server Component : le proxy rafraîchit déjà la session
          }
        },
      },
    },
  );
}
