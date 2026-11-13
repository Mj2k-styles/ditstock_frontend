import { expect } from '@playwright/test'

// Comptes créés par « flask seed-demo » (docker compose, SEED_DEMO=1)
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo12345!'
export const ADMIN = 'admin@ditstock.local'
export const GESTIONNAIRE = 'gestionnaire@ditstock.local'
export const MAGASINIER = 'magasinier@ditstock.local'

export const MAILPIT = process.env.E2E_MAILPIT_URL || 'http://localhost:8025'
export const PROMETHEUS = process.env.E2E_PROMETHEUS_URL || 'http://localhost:9090'

export async function login(page, email, password = DEMO_PASSWORD) {
  await page.goto('/login')
  await page.getByLabel('Adresse e-mail').fill(email)
  await page.getByLabel('Mot de passe').fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
}

// Jeton d'API (pour préparer des données sans passer par l'interface)
export async function apiToken(request, email, password = DEMO_PASSWORD) {
  const response = await request.post('/api/auth/login', { data: { email, password } })
  expect(response.ok()).toBeTruthy()
  return (await response.json()).access_token
}

// Mailpit : attend le dernier e-mail reçu par `to` dont le sujet contient `subject`
export async function waitForMail(request, to, subject) {
  let found = null
  await expect
    .poll(
      async () => {
        const res = await request.get(`${MAILPIT}/api/v1/messages?limit=50`)
        const { messages = [] } = await res.json()
        found = messages.find(
          (m) => m.To.some((r) => r.Address === to) && m.Subject.includes(subject),
        )
        return Boolean(found)
      },
      { timeout: 20_000, message: `e-mail « ${subject} » pour ${to}` },
    )
    .toBe(true)
  const detail = await request.get(`${MAILPIT}/api/v1/message/${found.ID}`)
  return detail.json()
}

export const unique = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`
