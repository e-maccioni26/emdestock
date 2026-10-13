import { expect, test, type Page } from '@playwright/test';

const ADMIN = { email: 'admin@emd-destock.test', password: 'AdminDemo2026!' };
const EMPLOYEE = { email: 'employe@emd-destock.test', password: 'EmployeDemo2026!' };

async function loginOk(page: Page, c: { email: string; password: string }) {
  await page.goto('/connexion');
  await page.getByLabel('E-mail').fill(c.email);
  await page.getByLabel('Mot de passe').fill(c.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/connexion'));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

test.describe.serial('journal d’actions', () => {
  test('une modification de produit par un employé apparaît dans le journal du gestionnaire', async ({
    page,
  }) => {
    await loginOk(page, EMPLOYEE);
    await page.goto('/produits');
    await page.getByRole('row').filter({ hasText: 'Ambre Nocturne' }).locator('a').first().click();
    await page.getByLabel('Prix HT (€)').fill('39,90');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Enregistré')).toBeVisible();
    // un employé ne voit ni le menu ni la page
    await expect(page.getByRole('link', { name: 'Journal' })).toHaveCount(0);
    await page.goto('/journal');
    await expect(page).not.toHaveURL(/\/journal/);
    await page.getByRole('button', { name: 'Se déconnecter' }).click();

    await loginOk(page, ADMIN);
    await page.getByRole('link', { name: 'Journal' }).click();
    const row = page
      .getByRole('row')
      .filter({ hasText: 'Sophie Employée' })
      .filter({ hasText: 'Ambre Nocturne' });
    await expect(row.first()).toContainText('Modification · Produit');
    await expect(row.first()).toContainText('Prix HT : 38,50 € → 39,90 €');
  });

  test('statut de commande et filtres', async ({ page }) => {
    await loginOk(page, ADMIN);
    await page.goto('/commandes');
    await page.getByRole('row').filter({ hasText: 'Reçue' }).first().click();
    await page.getByRole('radio', { name: 'En préparation' }).click();
    await expect(page.getByRole('radio', { name: 'En préparation' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await page.goto('/journal');
    await expect(
      page.getByRole('row').filter({ hasText: 'Modification · Commande' }).first(),
    ).toContainText('Statut : Reçue → En préparation');

    await page.getByLabel('Personne').selectOption({ label: 'Sophie Employée' });
    await expect(page).toHaveURL(/who=/);
    await expect(page.getByRole('row').filter({ hasText: 'Admin EMD' })).toHaveCount(0);
    await page.getByLabel('Personne').selectOption({ label: 'Toutes les personnes' });
    await page.getByLabel('Type d’élément').selectOption({ label: 'Commande' });
    await expect(page.getByRole('row').filter({ hasText: 'Ambre Nocturne' })).toHaveCount(0);
  });
});
