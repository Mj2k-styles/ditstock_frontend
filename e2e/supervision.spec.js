import { expect, test } from '@playwright/test'
import { PROMETHEUS } from './helpers'

test("Prometheus collecte les métriques de l'API", async ({ request }) => {
  await expect
    .poll(
      async () => {
        const res = await request.get(`${PROMETHEUS}/api/v1/targets?state=active`)
        const { data } = await res.json()
        return data.activeTargets.find((t) => t.labels.job === 'ditstock-api')?.health
      },
      { timeout: 60_000, message: 'cible ditstock-api' },
    )
    .toBe('up')
})

test("/health répond et /metrics n'est pas publié par le frontend", async ({ request }) => {
  const health = await request.get('http://localhost:5000/health/')
  expect(health.ok()).toBeTruthy()

  const metrics = await request.get('/metrics')
  expect(await metrics.text()).not.toContain('flask_http_request_total')
})
