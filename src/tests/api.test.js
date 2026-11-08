import { vi } from 'vitest'

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import client from '../api/client'
import { alerts, dashboard, products, users, warehouses } from '../api/resources'

describe('API resources', () => {
  beforeEach(() => vi.clearAllMocks())

  it('appelle les collections avec le "/" final attendu par Flask', async () => {
    client.get.mockResolvedValue({ data: [] })
    await products.list({ page: 1, per_page: 10 })
    expect(client.get).toHaveBeenCalledWith('/products/', { params: {} })
  })

  it("n'envoie pas page / per_page / q au serveur et pagine côté client", async () => {
    client.get.mockResolvedValue({
      data: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `P${i}`, sku: `S${i}` })),
    })
    const res = await products.list({ page: 2, per_page: 10, q: '', category_id: '' })
    expect(client.get).toHaveBeenCalledWith('/products/', { params: {} })
    expect(res.items).toHaveLength(2)
    expect(res.total).toBe(12)
  })

  it('utilise /<id> sans slash final pour modifier et archiver', async () => {
    client.put.mockResolvedValue({ data: {} })
    client.delete.mockResolvedValue({ data: {} })
    await products.update(3, { sku: 'A' })
    await users.remove(4)
    expect(client.put).toHaveBeenCalledWith('/products/3', { sku: 'A' })
    expect(client.delete).toHaveBeenCalledWith('/users/4')
  })

  it("construit le stock d'un entrepôt depuis /warehouse-stocks/ et /products/", async () => {
    client.get.mockImplementation((url) =>
      Promise.resolve({
        data:
          url === '/warehouse-stocks/'
            ? [
                { id: 1, warehouse_id: 1, product_id: 7, quantity: 3 },
                { id: 2, warehouse_id: 2, product_id: 7, quantity: 9 },
              ]
            : [{ id: 7, sku: 'INFO-1', name: 'Clavier' }],
      }),
    )
    const res = await warehouses.stock(1)
    expect(res.items).toEqual([
      { id: 1, warehouse_id: 1, product_id: 7, quantity: 3, sku: 'INFO-1', product_name: 'Clavier' },
    ])
  })

  it("donne un id React aux alertes (l'API n'en renvoie pas)", async () => {
    client.get.mockResolvedValue({
      data: [{ product_id: 7, warehouse_id: 1, product_name: 'Clavier', quantity: 3, minimum_stock: 10 }],
    })
    const res = await alerts.list({ page: 1, per_page: 10 })
    expect(res.items[0].id).toBe('7-1')
    expect(res.total).toBe(1)
  })

  it('adapte les statistiques du backend aux noms utilisés par le tableau de bord', async () => {
    client.get.mockResolvedValue({ data: { total_products: 4, stock_value: 89.7, total_alerts: 2 } })
    const s = await dashboard.stats()
    expect(client.get).toHaveBeenCalledWith('/dashboard/stats')
    expect(s.total_stock_value).toBe(89.7)
    expect(s.alerts_count).toBe(2)
    expect(s.total_products).toBe(4)
    expect(s.movements_today).toBeUndefined()
  })
})
