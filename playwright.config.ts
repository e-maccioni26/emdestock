import { defineConfig } from '@playwright/test';

// Tests de bout en bout du back-office, contre la version de production (next build + next start).
// Prérequis : Docker, `pnpm exec supabase start`, `pnpm db:reset` (données de démo) et `pnpm functions:serve`.
export default defineConfig({
  testDir: './e2e',
  timeout: 40_000,
  workers: 1, // les tests partagent la même base locale
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm --filter @emd/admin build && pnpm --filter @emd/admin exec next start -p 3100',
    url: 'http://localhost:3100/connexion',
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
