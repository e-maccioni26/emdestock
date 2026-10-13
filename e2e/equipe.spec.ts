import { expect, test, type Page } from '@playwright/test';

const ADMIN = { email: 'admin@emd-destock.test', password: 'AdminDemo2026!' };
const NEW = { first: 'Léa', last: 'Test', email: 'lea.test@emd-destock.test' };

async function attempt(page: Page, email: string, password: string) {
  await page.goto('/connexion');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}
async function loginOk(page: Page, email: string, password: string) {
  await attempt(page, email, password);
  await page.waitForURL((u) => !u.pathname.startsWith('/connexion'));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}
const memberCard = (page: Page, name: string) =>
  page
    .getByRole('list', { name: 'Comptes administrateurs' })
    .getByRole('listitem')
    .filter({ hasText: name });

test.describe.serial('équipe du back-office', () => {
  let password = '';

  test('un gestionnaire crée un compte employé qui peut se connecter', async ({ page }) => {
    await loginOk(page, ADMIN.email, ADMIN.password);
    await page.getByRole('link', { name: 'Équipe' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Équipe' })).toBeVisible();

    await page.getByRole('button', { name: 'Ajouter un employé' }).click();
    await page.getByLabel('Prénom').fill(NEW.first);
    await page.getByLabel('Nom', { exact: true }).fill(NEW.last);
    await page.getByLabel('Adresse e-mail').fill(NEW.email);
    password = await page.getByLabel('Mot de passe provisoire').inputValue();
    expect(password.length).toBeGreaterThanOrEqual(12);
    await page.getByRole('button', { name: 'Créer le compte' }).click();
    await expect(page.getByText('Compte prêt')).toBeVisible();
    await expect(memberCard(page, NEW.email)).toContainText('Employé');

    // e-mail déjà utilisé
    await page.getByRole('button', { name: 'Ajouter un employé' }).click();
    await page.getByLabel('Prénom').fill('Autre');
    await page.getByLabel('Nom', { exact: true }).fill('Personne');
    await page.getByLabel('Adresse e-mail').fill(NEW.email);
    await page.getByRole('button', { name: 'Créer le compte' }).click();
    await expect(page.getByText('Cette adresse e-mail est déjà utilisée.')).toBeVisible();
    await page.getByRole('button', { name: 'Annuler' }).click();

    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await loginOk(page, NEW.email, password);
    // l'employé accède au back-office mais ne gère pas l'équipe
    await expect(page.getByRole('link', { name: 'Équipe' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Mon compte' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Mon compte' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ajouter un employé' })).toHaveCount(0);
    await page.goto('/commandes');
    await expect(page.getByRole('heading', { level: 1, name: 'Commandes' })).toBeVisible();
  });

  test('un employé change son mot de passe', async ({ page }) => {
    await loginOk(page, NEW.email, password);
    await page.goto('/equipe');
    await page.getByLabel('Nouveau mot de passe', { exact: true }).fill('court');
    await page.getByLabel('Confirmer le mot de passe').fill('court');
    await page.getByRole('button', { name: 'Changer le mot de passe' }).click();
    await expect(page.getByText('Au moins 12 caractères')).toBeVisible();
    password = 'NouveauSecret2026';
    await page.getByLabel('Nouveau mot de passe', { exact: true }).fill(password);
    await page.getByLabel('Confirmer le mot de passe').fill(password);
    await page.getByRole('button', { name: 'Changer le mot de passe' }).click();
    await expect(page.getByText('Mot de passe modifié')).toBeVisible();
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await loginOk(page, NEW.email, password);
  });

  test('désactiver coupe l’accès, réactiver le rend, nouveau mot de passe, suppression', async ({
    page,
  }) => {
    await loginOk(page, ADMIN.email, ADMIN.password);
    await page.goto('/equipe');
    const card = memberCard(page, NEW.email);
    page.on('dialog', (d) => d.accept());

    await card.getByRole('button', { name: 'Désactiver' }).click();
    await expect(card).toContainText('Désactivé');
    // aucune action sur son propre compte
    await expect(memberCard(page, 'admin@emd-destock.test').getByRole('button')).toHaveCount(0);
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await attempt(page, NEW.email, password);
    await expect(page.getByText(/incorrect|n’a pas accès/)).toBeVisible();

    await loginOk(page, ADMIN.email, ADMIN.password);
    await page.goto('/equipe');
    await card.getByRole('button', { name: 'Réactiver' }).click();
    await expect(card).not.toContainText('Désactivé');
    await card.getByRole('button', { name: 'Nouveau mot de passe' }).click();
    password = 'Reinitialise2026x';
    await card.getByLabel('Nouveau mot de passe provisoire').fill(password);
    await card.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(card.getByText('Compte prêt')).toBeVisible();
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await loginOk(page, NEW.email, password);
    await page.getByRole('button', { name: 'Se déconnecter' }).click();

    await loginOk(page, ADMIN.email, ADMIN.password);
    await page.goto('/equipe');
    await card.getByRole('button', { name: 'Supprimer' }).click();
    await expect(card).toHaveCount(0);
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await attempt(page, NEW.email, password);
    await expect(page.getByText('E-mail ou mot de passe incorrect.')).toBeVisible();

    // chaque opération est dans le journal, au nom du gestionnaire, sans mot de passe
    await loginOk(page, ADMIN.email, ADMIN.password);
    await page.goto('/journal?entity=admin_account');
    for (const action of [
      'Création',
      'Désactivation',
      'Réactivation',
      'Nouveau mot de passe',
      'Suppression',
    ]) {
      await expect(
        page
          .getByRole('row')
          .filter({ hasText: `${action} · Compte admin` })
          .filter({ hasText: NEW.email })
          .filter({ hasText: 'Admin EMD' }),
      ).toHaveCount(1);
    }
    await expect(page.getByText(password)).toHaveCount(0);
  });
});
