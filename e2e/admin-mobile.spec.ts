import { expect, test, type Page } from '@playwright/test';

// Back-office sous 768 px (maquette AdminMobile) : barre d'onglets, cartes, pas de débordement.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

async function login(page: Page) {
  await page.goto('/connexion');
  await page.getByLabel('E-mail').fill('admin@emd-destock.test');
  await page.getByLabel('Mot de passe').fill('AdminDemo2026!');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/connexion'));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

const nav = (page: Page) => page.getByRole('navigation', { name: 'Navigation du back-office' });

test.describe('smartphone', () => {
  test.beforeEach(({ page }) => login(page));

  test('barre d’onglets : navigation et menu Plus', async ({ page }) => {
    await expect(nav(page).getByRole('link', { name: /Tableau/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    for (const [label, path] of [
      ['Commandes', '/commandes'],
      ['Produits', '/produits'],
      ['Clients', '/clients'],
    ] as const) {
      await nav(page)
        .getByRole('link', { name: new RegExp(label) })
        .click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
    await nav(page).getByRole('button', { name: 'Plus' }).click();
    await page.getByRole('menuitem', { name: 'Encarts d’accueil' }).click();
    await expect(page).toHaveURL(/\/encarts$/);
    await nav(page).getByRole('button', { name: 'Plus' }).click();
    await page.getByRole('menuitem', { name: 'Se déconnecter' }).click();
    await expect(page).toHaveURL(/\/connexion/);
  });

  test('la barre latérale est masquée, les zones tactiles font 44 px', async ({ page }) => {
    await expect(page.locator('aside')).toBeHidden();
    for (const link of await nav(page).getByRole('link').all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    const bell = await page.getByRole('button', { name: /^Notifications/ }).boundingBox();
    expect(bell!.width).toBeGreaterThanOrEqual(44);
  });

  test('aucune page ne déborde horizontalement', async ({ page }) => {
    await page.goto('/commandes');
    const order = await page.locator('a[href^="/commandes/"]').first().getAttribute('href');
    await page.goto('/produits');
    const product = await page
      .locator('a[href^="/produits/"]:not([href="/produits/nouveau"])')
      .first()
      .getAttribute('href');
    await page.goto('/clients?tab=actifs');
    const client = await page.locator('a[href^="/clients/"]').first().getAttribute('href');
    for (const path of [
      '/',
      '/commandes',
      order!,
      '/produits',
      product!,
      '/produits/nouveau',
      '/clients',
      '/clients?tab=actifs',
      client!,
      '/encarts',
    ]) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test('commandes : une carte ouvre le détail, statut modifiable', async ({ page }) => {
    await page.goto('/commandes');
    await page.getByRole('row').first().click();
    await expect(page).toHaveURL(/\/commandes\/.+/);
    await expect(page.getByRole('radiogroup', { name: 'Changer le statut' })).toBeVisible();
  });
});

test('manifeste PWA public avec icônes', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.display).toBe('standalone');
  expect(m.icons.length).toBeGreaterThanOrEqual(3);
  expect((await request.get(m.icons[0].src)).ok()).toBe(true);
});
