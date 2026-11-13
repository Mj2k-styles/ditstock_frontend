import { expect, test } from '@playwright/test'
import { ADMIN, MAGASINIER, apiToken, login, unique, waitForMail } from './helpers'

test("l'administrateur voit tout le menu", async ({ page }) => {
  await login(page, ADMIN)
  const nav = page.getByRole('navigation', { name: 'Navigation principale' })
  await expect(nav.getByRole('link', { name: 'Utilisateurs' })).toBeVisible()
  await expect(nav.getByRole('link', { name: "Journal d'audit" })).toBeVisible()
})

test('le magasinier ne voit ni les utilisateurs ni le journal', async ({ page }) => {
  await login(page, MAGASINIER)
  const nav = page.getByRole('navigation', { name: 'Navigation principale' })
  await expect(nav.getByRole('link', { name: 'Produits' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Utilisateurs' })).toHaveCount(0)
  await page.goto('/utilisateurs')
  await expect(page).toHaveURL(/acces-refuse/)
  await expect(page.getByRole('heading', { name: 'Page inaccessible' })).toBeVisible()
})

test('identifiants incorrects refusés', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Adresse e-mail').fill(ADMIN)
  await page.getByLabel('Mot de passe').fill('mauvais-mot-de-passe')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByText('E-mail ou mot de passe incorrect.')).toBeVisible()
})

test('mot de passe oublié : lien par e-mail puis nouveau mot de passe', async ({ page, request }) => {
  // Utilisateur dédié au test, créé par l'administrateur via l'API
  const email = `${unique('oubli').toLowerCase()}@ditstock.local`
  const token = await apiToken(request, ADMIN)
  const created = await request.post('/api/users/', {
    headers: { Authorization: `Bearer ${token}` },
    data: { email, password: 'Initial12345', full_name: 'Test Oubli', role: 'magasinier' },
  })
  expect(created.status()).toBe(201)

  await page.goto('/login')
  await page.getByRole('link', { name: 'Mot de passe oublié ?' }).click()
  await page.getByLabel('Adresse e-mail').fill(email)
  await page.getByRole('button', { name: 'Envoyer le lien' }).click()
  await expect(page.getByText(/lien de réinitialisation vient d'être envoyé/i)).toBeVisible()

  const mail = await waitForMail(request, email, 'Réinitialisation')
  const link = mail.Text.match(/https?:\/\/\S+reinitialiser-mot-de-passe\?token=\S+/)[0]
  await page.goto(link.replace(/^https?:\/\/[^/]+/, ''))

  await page.getByLabel('Nouveau mot de passe').fill('Nouveau12345')
  await page.getByLabel('Confirmer le mot de passe').fill('Nouveau12345')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByText(/vous pouvez vous connecter/i)).toBeVisible()

  await login(page, email, 'Nouveau12345')
})
