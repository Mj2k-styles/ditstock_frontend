import { expect, test } from '@playwright/test'
import { ADMIN, GESTIONNAIRE, MAGASINIER, login, unique, waitForMail } from './helpers'

// Parcours complet : création d'un produit avec stock initial, sortie, alerte de seuil,
// refus d'une sortie trop grande, puis trace dans le journal d'audit.
test.describe.serial('cycle de vie du stock', () => {
  const sku = unique('E2E')
  const name = `Produit ${sku}`

  test('le gestionnaire crée un produit avec son stock initial', async ({ page }) => {
    await login(page, GESTIONNAIRE)
    await page.goto('/produits')
    await page.getByRole('button', { name: 'Ajouter un produit' }).click()

    const dialog = page.getByRole('dialog', { name: 'Ajouter un produit' })
    await dialog.getByLabel('Référence (SKU)').fill(sku)
    await dialog.getByLabel('Nom', { exact: true }).fill(name)
    await dialog.getByLabel("Prix d'achat (FCFA)").fill('1500')
    await dialog.getByLabel('Prix de vente (FCFA)').fill('2500')
    await dialog.getByLabel('Seuil minimal').fill('5')
    await dialog.getByLabel('Entrepôt central').fill('6')
    await dialog.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(dialog).toBeHidden()

    await page.getByLabel('Rechercher un produit').fill(sku)
    const row = page.getByRole('row', { name: new RegExp(sku) })
    await expect(row).toContainText('6 pièce')
    await expect(row).toContainText('Normal')
  })

  test('une sortie sous le seuil déclenche une alerte et un e-mail', async ({ page, request }) => {
    await login(page, MAGASINIER)
    await page.goto('/mouvements')
    await page.getByRole('tab', { name: 'Sortie' }).click()
    await page.locator('#m-product').selectOption({ label: `${sku} — ${name}` })
    await page.locator('#m-wh').selectOption({ label: 'Entrepôt central' })
    await page.locator('#m-qty').fill('2')
    await page.locator('#m-motif').selectOption('Vente')
    await page.getByRole('button', { name: 'Enregistrer la sortie' }).click()
    await expect(page.getByText('Sortie enregistrée.')).toBeVisible()

    const mail = await waitForMail(request, GESTIONNAIRE, name)
    expect(mail.Text).toContain('est passé à 4')

    await page.goto('/alertes')
    await expect(page.getByRole('row', { name: new RegExp(name) })).toBeVisible()
  })

  test('une sortie plus grande que le stock est refusée', async ({ page }) => {
    await login(page, MAGASINIER)
    await page.goto('/mouvements')
    await page.getByRole('tab', { name: 'Sortie' }).click()
    await page.locator('#m-product').selectOption({ label: `${sku} — ${name}` })
    await page.locator('#m-wh').selectOption({ label: 'Entrepôt central' })
    await page.locator('#m-qty').fill('100')
    await page.locator('#m-motif').selectOption('Perte')
    await page.getByRole('button', { name: 'Enregistrer la sortie' }).click()
    await expect(page.getByText(/stock insuffisant/i)).toBeVisible()
  })

  test("le filtre « Sous le seuil » et le journal d'audit le retrouvent", async ({ page }) => {
    await login(page, ADMIN)
    await page.goto('/produits')
    await page.getByLabel('État du stock').selectOption({ label: 'Sous le seuil' })
    await page.getByLabel('Rechercher un produit').fill(sku)
    await expect(page.getByRole('row', { name: new RegExp(sku) })).toContainText('4 pièce')

    await page.goto('/audit')
    await expect(page.getByRole('row', { name: new RegExp(`CREATION.*${sku}`) })).toBeVisible()
  })
})
