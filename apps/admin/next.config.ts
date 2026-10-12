import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@emd/shared'],
  // Next 16 bloque les ressources de développement (JS, HMR) venant d'une autre origine que localhost :
  // sans cette liste, ouvrir http://127.0.0.1:3000 affiche la page mais aucun bouton ne répond (React ne s'hydrate pas).
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.*.*'],
};

export default config;
