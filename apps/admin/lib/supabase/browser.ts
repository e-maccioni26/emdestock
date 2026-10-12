import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@emd/shared';

// Navigateur : clé anon + session de l'admin (cookies). Sert au temps réel des notifications.
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
