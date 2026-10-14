import { expect, test, type Page } from '@playwright/test';

const ADMIN = { email: 'admin@emd-destock.test', password: 'AdminDemo2026!' };

/** Connexion réussie : attend d'être arrivé sur le tableau de bord avant de continuer. */
async function loginOk(page: Page) {
  await login(page);
  await page.waitForURL((u) => !u.pathname.startsWith('/connexion'));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

const confirmModal = (page: Page, label: string) =>
  page.locator('dialog[open]').getByRole('button', { name: label, exact: true }).click();

async function login(page: Page, creds = ADMIN) {
  await page.goto('/connexion');
  await page.getByLabel('E-mail').fill(creds.email);
  await page.getByLabel('Mot de passe').fill(creds.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}

test.describe('accès', () => {
  test('un visiteur est renvoyé vers la connexion', async ({ page }) => {
    await page.goto('/commandes');
    await expect(page).toHaveURL(/\/connexion/);
  });

  test('mauvais mot de passe et compte client refusés', async ({ page }) => {
    await login(page, { email: ADMIN.email, password: 'faux-mot-de-passe' });
    await expect(page.getByText('E-mail ou mot de passe incorrect.')).toBeVisible();
    await login(page, { email: 'demo-client@emd-destock.test', password: 'ClientDemo2026!' });
    await expect(page.getByText('Ce compte n’a pas accès au back-office.')).toBeVisible();
  });

  test('connexion, navigation de tout le menu, déconnexion', async ({ page }) => {
    await loginOk(page);
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
    for (const [link, title] of [
      ['Commandes', 'Commandes'],
      ['Produits & stocks', 'Produits & stocks'],
      ['Clients', 'Clients'],
      ['Encarts d’accueil', 'Encarts d’accueil'],
      ['Tableau de bord', 'Tableau de bord'],
    ] as const) {
      await page
        .getByRole('navigation', { name: 'Navigation du back-office' })
        .getByRole('link', { name: link })
        .click();
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    }
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await expect(page).toHaveURL(/\/connexion/);
  });
});

test.describe('tableau de bord et notifications', () => {
  test.beforeEach(({ page }) => loginOk(page));

  test('périodes semaine / mois / année', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Période' });
    await group.getByRole('link', { name: 'Semaine' }).click();
    await expect(page.getByText(/Semaine du .*, par jour/)).toBeVisible();
    await group.getByRole('link', { name: 'Année' }).click();
    await expect(page.getByText(/2026, par mois/)).toBeVisible();
    await group.getByRole('link', { name: 'Mois' }).click();
    await expect(page.getByText(/par semaine/)).toBeVisible();
  });

  test('cloche : ouverture, fermeture, tout marquer comme lu', async ({ page }) => {
    await page.getByRole('button', { name: /^Notifications/ }).click();
    const panel = page.getByRole('dialog', { name: 'Notifications' });
    await expect(panel).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await page.getByRole('button', { name: /^Notifications/ }).click();
    await page.getByRole('button', { name: 'Tout marquer comme lu' }).click();
    await expect(page.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible();
  });

  test('« Examiner » mène aux demandes d’inscription', async ({ page }) => {
    await page.getByRole('link', { name: 'Examiner' }).click();
    await expect(page.getByRole('tab', { name: /Demandes d’inscription/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});

test.describe('commandes', () => {
  test.beforeEach(({ page }) => loginOk(page));

  test('onglets, recherche, filtres, ouverture du détail', async ({ page }) => {
    await page.goto('/commandes?period=all');
    const rows = page.getByRole('row').filter({ hasText: 'CMD-' });
    await expect(rows.first()).toBeVisible();
    await page.getByRole('tab', { name: /^Annulées/ }).click();
    await expect(rows).not.toHaveCount(0);
    await page.getByRole('tab', { name: /^Toutes/ }).click();
    await page.getByLabel('N° de commande, client, magasin').fill('Rivoli');
    await expect(page).toHaveURL(/q=Rivoli/);
    await expect(rows.first()).toContainText('Rivoli');
    await page.getByLabel('N° de commande, client, magasin').fill('');
    await page.getByLabel('Client', { exact: true }).selectOption({ label: 'Senteurs du Marais' });
    await expect(page).toHaveURL(/company=/);
    await expect(rows.first()).toContainText('Senteurs du Marais');
    await rows.first().click();
    await expect(page).toHaveURL(/\/commandes\/.+/);
    await expect(page.getByRole('heading', { name: 'Produits commandés' })).toBeVisible();
  });

  test('détail : changement de statut puis retour, impression', async ({ page }) => {
    await page.goto('/commandes?period=all&tab=received');
    await page.getByRole('row').filter({ hasText: 'CMD-2026-0140' }).click();
    await expect(page.getByRole('radio', { name: 'Reçue' })).toBeChecked();
    await page.getByRole('radio', { name: 'En préparation' }).click();
    await expect(page.getByRole('radio', { name: 'En préparation' })).toBeChecked();
    await expect(page.getByText('Statut : Reçue → En préparation')).toBeVisible();
    await page.getByRole('radio', { name: 'Reçue' }).click();
    await expect(page.getByRole('radio', { name: 'Reçue' })).toBeChecked();
    await page.evaluate(() => {
      (window as unknown as { printed: boolean }).printed = false;
      window.print = () => {
        (window as unknown as { printed: boolean }).printed = true;
      };
    });
    await page.getByRole('button', { name: 'Imprimer le bon' }).click();
    expect(await page.evaluate(() => (window as unknown as { printed: boolean }).printed)).toBe(
      true,
    );
  });

  test('pagination', async ({ page }) => {
    await page.goto('/commandes?period=all');
    const next = page.getByRole('link', { name: 'Suivant' });
    if (await next.count()) {
      await next.click();
      await expect(page).toHaveURL(/page=2/);
      await page.getByRole('link', { name: 'Précédent' }).click();
    }
  });
});

test.describe('produits', () => {
  test.beforeEach(({ page }) => loginOk(page));

  test('onglets, recherche, filtres', async ({ page }) => {
    await page.goto('/produits');
    await page.getByRole('tab', { name: /^Rupture/ }).click();
    await expect(page.getByRole('row').filter({ hasText: 'Rupture' }).first()).toBeVisible();
    await page.getByRole('tab', { name: /^Tous/ }).click();
    await page.getByLabel('Nom, référence ou code EAN').fill('vetiver');
    await expect(page.getByRole('row').filter({ hasText: 'AS-VG-050' })).toBeVisible();
    await page.getByLabel('Nom, référence ou code EAN').fill('');
    await page.getByLabel('Marque', { exact: true }).selectOption({ label: 'Maison Lior' });
    await expect(page).toHaveURL(/brand=/);
    await expect(page.getByRole('row').filter({ hasText: 'Maison Lior' }).first()).toBeVisible();
  });

  test('interrupteur de visibilité', async ({ page }) => {
    await page.goto('/produits?tab=visible');
    const sw = page.getByRole('switch', { name: /Ambre Nocturne/ });
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await page.reload();
    await page.getByRole('tab', { name: /^Masqués/ }).click();
    const hidden = page.getByRole('switch', { name: /Ambre Nocturne/ });
    await expect(hidden).toHaveAttribute('aria-checked', 'false');
    await hidden.click(); // remet en visible
    await expect(hidden).toHaveCount(0);
  });

  test('création, modification, suppression d’un produit', async ({ page }) => {
    const ref = `E2E-${Date.now() % 100000}`;
    await page.goto('/produits/nouveau');
    await page.getByLabel('Titre', { exact: true }).fill('Produit E2E');
    await page.getByLabel('Référence').fill(ref);
    await page.getByLabel('Code EAN').fill('4006381333931');
    await page.getByLabel('Prix HT (€)').fill('12,50');
    await page.getByLabel('Stock disponible (u.)').fill('7');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page).toHaveURL(/\/produits\/[0-9a-f-]{36}/);
    await expect(page.getByRole('heading', { level: 1, name: 'Produit E2E' })).toBeVisible();

    await page.getByLabel('Titre', { exact: true }).fill('Produit E2E modifié');
    await page.getByLabel('Code EAN').fill('4006381333930'); // clé invalide
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Clé de contrôle EAN invalide.')).toBeVisible();
    await page.getByLabel('Code EAN').fill('4006381333931');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Enregistré')).toBeVisible();

    await page.getByRole('button', { name: 'Supprimer le produit' }).click();
    await confirmModal(page, 'Supprimer');
    await expect(page).toHaveURL(/\/produits$/);
    await expect(page.getByText('Produit E2E modifié')).toHaveCount(0);
  });

  test('visibilité par client : exclure puis rétablir', async ({ page }) => {
    await page.goto('/produits');
    await page.getByRole('row').filter({ hasText: 'Ambre Nocturne' }).locator('a').first().click();
    const box = page.getByRole('checkbox', { name: 'Parfumerie Wilson' });
    await expect(page.getByText('Aucun client exclu.')).toBeVisible();
    await page.getByLabel('Rechercher un client').fill('wilson');
    await box.check();
    await page.getByLabel('Rechercher un client').fill('');
    await expect(page.getByText('Masqué pour 1 client.')).toBeVisible();
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Enregistré')).toBeVisible();
    await page.reload();
    await expect(box).toBeChecked();
    await box.uncheck();
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Enregistré')).toBeVisible();
    await page.reload();
    await expect(box).not.toBeChecked();
  });

  test('création d’une marque depuis la fiche produit (modale)', async ({ page }) => {
    await page.goto('/produits/nouveau');
    const brand = page.getByLabel('Marque', { exact: true });
    await brand.selectOption('__new');
    const modal = page.getByRole('dialog', { name: 'Nouvelle marque' });
    await expect(modal.getByRole('button', { name: 'Créer' })).toBeDisabled();
    // une marque existante est refusée sans fermer la fenêtre
    await modal.getByLabel('Nom de la marque').fill('Maison Lior');
    await modal.getByRole('button', { name: 'Créer' }).click();
    await expect(modal.getByText('Cette marque existe déjà.')).toBeVisible();
    await modal.getByLabel('Nom de la marque').fill(`Marque E2E ${Date.now() % 100000}`);
    await modal.getByRole('button', { name: 'Créer' }).click();
    await expect(modal).toBeHidden();
    await expect(brand).not.toHaveValue('');
    await expect(brand).not.toHaveValue('__new');
    // annuler ne crée rien
    await brand.selectOption('__new');
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('création d’une catégorie, puis d’une sous-catégorie (modale)', async ({ page }) => {
    await page.goto('/produits/nouveau');
    const category = page.getByLabel('Catégorie', { exact: true });
    const stamp = Date.now() % 100000;
    await category.selectOption('__new');
    const modal = page.getByRole('dialog', { name: 'Nouvelle catégorie' });
    await expect(modal.getByRole('checkbox')).toHaveCount(0); // rien de sélectionné : premier niveau
    await modal.getByLabel('Nom de la catégorie').fill(`Cat E2E ${stamp}`);
    await modal.getByRole('button', { name: 'Créer' }).click();
    await expect(modal).toBeHidden();
    await expect(category.locator('option:checked')).toHaveText(`Cat E2E ${stamp}`);

    await category.selectOption('__new');
    await expect(
      modal.getByRole('checkbox', { name: `Créer dans « Cat E2E ${stamp} »` }),
    ).toBeChecked();
    await modal.getByLabel('Nom de la catégorie').fill(`Sous ${stamp}`);
    await modal.getByRole('button', { name: 'Créer' }).click();
    await expect(modal).toBeHidden();
    await expect(category.locator('option:checked')).toHaveText(`Cat E2E ${stamp} › Sous ${stamp}`);
  });

  test('un produit commandé ne peut pas être supprimé', async ({ page }) => {
    await page.goto('/produits');
    await page.getByRole('row').filter({ hasText: 'ML-AN-100' }).locator('a').first().click();
    await page.getByRole('button', { name: 'Supprimer le produit' }).click();
    await confirmModal(page, 'Supprimer');
    await expect(page.getByText(/figure dans une commande/).last()).toBeVisible();
  });

  test('photos : ajout, déplacement, suppression', async ({ page }) => {
    await page.goto('/produits');
    await page.getByRole('row').filter({ hasText: 'BP-GDF-250' }).locator('a').first().click();
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    for (let i = 0; i < 2; i++) {
      await page
        .locator('input[type=file]')
        .setInputFiles({ name: `p${i}.png`, mimeType: 'image/png', buffer: png });
      await expect(page.getByRole('button', { name: `Supprimer la photo ${i + 1}` })).toBeVisible();
    }
    await page.getByRole('button', { name: 'Déplacer la photo 1 vers la droite' }).click();
    await page.getByRole('button', { name: 'Supprimer la photo 2' }).click();
    await confirmModal(page, 'Supprimer');
    await expect(page.getByRole('button', { name: 'Supprimer la photo 2' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Supprimer la photo 1' }).click();
    await confirmModal(page, 'Supprimer');
    await expect(page.getByRole('button', { name: 'Supprimer la photo 1' })).toHaveCount(0);
  });
});

test.describe('clients', () => {
  test.beforeEach(({ page }) => loginOk(page));

  test('clients actifs : recherche et fiche', async ({ page }) => {
    await page.goto('/clients');
    await page.getByRole('tab', { name: /^Clients actifs/ }).click();
    await page.getByLabel('Raison sociale, contact, SIRET').fill('wilson');
    await expect(page.getByRole('row').filter({ hasText: 'Parfumerie Wilson SAS' })).toBeVisible();
    await page.getByRole('row').filter({ hasText: 'Parfumerie Wilson SAS' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Parfumerie Wilson SAS' }),
    ).toBeVisible();
  });

  test('fiche : suspension, entreprise, magasin, ancien client', async ({ page }) => {
    await page.goto('/clients?tab=actifs');
    await page.getByRole('row').filter({ hasText: 'Beauté Rivoli SARL' }).click();

    await page.getByRole('button', { name: 'Suspendre l’accès' }).click();
    await confirmModal(page, 'Suspendre');
    await expect(page.getByRole('button', { name: 'Réactiver l’accès' })).toBeVisible();
    await page.getByRole('button', { name: 'Réactiver l’accès' }).click();
    await expect(page.getByRole('button', { name: 'Suspendre l’accès' })).toBeVisible();

    const former = page.getByRole('checkbox', { name: 'Ancien client' });
    // l'enregistrement est une action serveur : attendre sa réponse avant de recharger
    const saved = () => page.waitForResponse((r) => r.request().method() === 'POST');
    await Promise.all([saved(), former.check()]);
    await page.reload();
    await expect(former).toBeChecked();
    await Promise.all([saved(), former.uncheck()]);

    await page.getByRole('button', { name: 'Modifier', exact: true }).click();
    await page.getByLabel('Téléphone').fill('0102030405');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('0102030405')).toBeVisible();

    await page.getByRole('button', { name: 'Associer un magasin' }).click();
    await page.getByLabel('Nom du magasin').fill('Magasin E2E');
    await page.getByLabel('Adresse', { exact: true }).fill('1 rue du Test');
    await page.getByLabel('Code postal').fill('75001');
    await page.getByLabel('Ville').fill('Paris');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Magasin E2E')).toBeVisible();
    await page.getByRole('button', { name: 'Modifier Magasin E2E' }).click();
    await page.getByLabel('Nom du magasin').fill('Magasin E2E bis');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Magasin E2E bis')).toBeVisible();
  });

  test('demandes : refuser puis valider', async ({ page }) => {
    await page.goto('/clients');
    const card = (name: string) => page.locator('article').filter({ hasText: name });
    await card('Parfums & Co Nantes').getByRole('button', { name: 'Refuser' }).click();
    await expect(card('Parfums & Co Nantes').getByText('Demande refusée')).toBeVisible();
    await card("L'Atelier Beauté Lyon").getByRole('button', { name: 'Valider l’accès' }).click();
    await expect(card("L'Atelier Beauté Lyon").getByText(/Accès validé/)).toBeVisible();
  });
});

test.describe('encarts', () => {
  test.beforeEach(({ page }) => loginOk(page));

  test('sélection, modification, enregistrement, ordre', async ({ page }) => {
    await page.goto('/encarts');
    await expect(page.getByRole('heading', { name: 'Modifier l’encart' })).toBeVisible();
    await page.getByRole('button', { name: /Modifier l’encart Vétiver/ }).click();
    await expect(page.getByLabel('Titre', { exact: true })).toHaveValue(/Vétiver/);
    const original = await page.getByLabel('Texte du bouton').inputValue();
    await page.getByLabel('Texte du bouton').fill('Voir');
    await page.getByRole('button', { name: 'Fond Pierre' }).click();
    await page.getByRole('button', { name: 'Tous les clients' }).click();
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Enregistré')).toBeVisible();
    await page.getByLabel('Texte du bouton').fill(original);
    await page.getByRole('button', { name: 'Fond Blanc' }).click();
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Enregistré')).toBeVisible();

    const titles = () => page.locator('[aria-label^="Modifier l’encart "]').allTextContents();
    const labels = await page
      .locator('[aria-label^="Modifier l’encart "]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    await page.getByRole('button', { name: 'Descendre' }).first().click();
    await expect
      .poll(
        async () =>
          (
            await page
              .locator('[aria-label^="Modifier l’encart "]')
              .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
          )[0],
      )
      .not.toBe(labels[0]);
    await page.getByRole('button', { name: 'Monter' }).nth(1).click();
    await expect
      .poll(
        async () =>
          (
            await page
              .locator('[aria-label^="Modifier l’encart "]')
              .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
          )[0],
      )
      .toBe(labels[0]);
    void titles;
  });

  test('création avec destination produit, puis suppression', async ({ page }) => {
    await page.goto('/encarts');
    await page.getByRole('button', { name: 'Nouvel encart' }).click();
    await page.getByLabel('Surtitre').fill('E2E');
    await page.getByLabel('Titre', { exact: true }).fill('Encart E2E');
    await page.getByRole('button', { name: 'Produit', exact: true }).click();
    await page.getByLabel('Rechercher un produit').fill('vetiver');
    await page.getByRole('option', { name: /Vétiver Gris/ }).click();
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Enregistré')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Modifier l’encart Encart E2E' })).toBeVisible();
    await page.getByRole('button', { name: 'Supprimer l’encart' }).click();
    await confirmModal(page, 'Supprimer');
    await expect(page.getByRole('button', { name: 'Modifier l’encart Encart E2E' })).toHaveCount(0);
  });

  test('suppression : modale de confirmation, annulable', async ({ page }) => {
    await page.goto('/encarts');
    const first = page.getByRole('button', { name: /^Modifier l’encart / }).first();
    await expect(first).toBeVisible();
    const count = await page.getByRole('button', { name: /^Modifier l’encart / }).count();

    await page.getByRole('button', { name: 'Supprimer l’encart' }).click();
    const modal = page.getByRole('dialog', { name: 'Supprimer cet encart ?' });
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Action irréversible');
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();

    await page.getByRole('button', { name: 'Supprimer l’encart' }).click();
    await modal.getByRole('button', { name: 'Annuler' }).click();
    await expect(modal).toBeHidden();
    await expect(page.getByRole('button', { name: /^Modifier l’encart / })).toHaveCount(count);
  });

  test('destination sélection de plusieurs produits', async ({ page }) => {
    await page.goto('/encarts');
    await page.getByRole('button', { name: 'Nouvel encart' }).click();
    await page.getByLabel('Surtitre').fill('E2E');
    await page.getByLabel('Titre', { exact: true }).fill('Sélection E2E');
    await page.getByRole('button', { name: 'Sélection de produits' }).click();
    for (const [q, title] of [
      ['vetiver', /Vétiver Gris/],
      ['musc', /Musc Blanc/],
    ] as const) {
      await page.getByLabel('Rechercher un produit').fill(q);
      await page.getByRole('option', { name: title }).click();
    }
    await page.getByRole('button', { name: 'Fermer' }).click();
    await expect(page.getByRole('button', { name: /^Retirer / })).toHaveCount(2);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Enregistré')).toBeVisible();
    await page.getByRole('button', { name: 'Supprimer l’encart' }).click();
    await confirmModal(page, 'Supprimer');
    await expect(page.getByRole('button', { name: 'Modifier l’encart Sélection E2E' })).toHaveCount(
      0,
    );
  });
});
