import { errorMessage, formatMoney, isNotAvailable, stockState } from '../utils/format'
import { normalizePage, paginateLocally } from '../api/resources'

describe('format', () => {
  it('formate un montant en FCFA', () => {
    expect(formatMoney(15000)).toMatch(/15\s?000/)
  })
  it("calcule l'état du stock", () => {
    expect(stockState({ stock_total: 0, minimum_stock: 5 })).toBe('rupture')
    expect(stockState({ stock_total: 3, minimum_stock: 5 })).toBe('alerte')
    expect(stockState({ stock_total: 20, minimum_stock: 5 })).toBe('ok')
    // même règle que le backend : alerte seulement si la quantité est strictement sous le seuil
    expect(stockState({ stock_total: 5, minimum_stock: 5 })).toBe('ok')
  })
  it("n'invente pas d'état quand la quantité est inconnue", () => {
    expect(stockState({ minimum_stock: 5 })).toBeNull()
  })
  it("extrait le message d'erreur du backend", () => {
    expect(errorMessage({ response: { data: { message: 'Stock insuffisant' } } })).toBe('Stock insuffisant')
    expect(errorMessage({})).toMatch(/joindre/i)
  })
  it('détecte une route absente du backend (404 Flask) et la distingue d’un 404 métier', () => {
    const missing = { response: { status: 404, data: { message: 'The requested URL was not found on the server.' } } }
    const business = { response: { status: 404, data: { message: 'Produit introuvable' } } }
    const html = { response: { status: 404, data: '<!doctype html><title>404 Not Found</title><h1>Not Found</h1>' } }
    expect(isNotAvailable(missing)).toBe(true)
    expect(isNotAvailable(html)).toBe(true)
    expect(errorMessage(html)).toMatch(/pas encore disponible/i)
    expect(isNotAvailable(business)).toBe(false)
    expect(errorMessage(missing)).toMatch(/pas encore disponible/i)
    expect(errorMessage(business)).toBe('Produit introuvable')
  })
  it('met en forme les erreurs de validation Marshmallow', () => {
    const err = { response: { status: 400, data: { errors: { sku: ['Missing data for required field.'] } } } }
    expect(errorMessage(err)).toMatch(/sku/)
  })
})

describe('normalizePage', () => {
  it('accepte un tableau simple', () => {
    expect(normalizePage([{ id: 1 }]).total).toBe(1)
  })
  it('accepte un objet paginé', () => {
    const p = normalizePage({ items: [{ id: 1 }], total: 25, per_page: 10, page: 2 })
    expect(p.pages).toBe(3)
    expect(p.page).toBe(2)
  })
})

describe('paginateLocally', () => {
  const rows = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    sku: `SKU-${i + 1}`,
    name: i % 2 ? 'Clavier' : 'Souris',
    category_id: i % 5,
  }))
  it('découpe en pages', () => {
    const p = paginateLocally(rows, { page: 3, per_page: 10, searchKeys: ['name'] })
    expect(p.items).toHaveLength(5)
    expect(p.pages).toBe(3)
    expect(p.total).toBe(25)
  })
  it('filtre par recherche (insensible à la casse) et par champ', () => {
    expect(paginateLocally(rows, { q: 'clav', searchKeys: ['name', 'sku'] }).total).toBe(12)
    expect(paginateLocally(rows, { filters: { category_id: '2' }, searchKeys: [] }).total).toBe(5)
  })
})
