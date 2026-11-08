import client from './client'

// Le backend Flask renvoie pour l'instant des tableaux simples (sans pagination).
// normalizePage accepte donc un tableau OU un objet paginé ({ items|data|results, total, ... }),
// de sorte que le frontend continuera de fonctionner si la pagination serveur est ajoutée plus tard.
export function normalizePage(data, perPage = 10) {
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, pages: 1 }
  }
  const items = data?.items ?? data?.data ?? data?.results ?? []
  const total = data?.total ?? data?.count ?? items.length
  const size = data?.per_page ?? perPage
  const page = data?.page ?? 1
  const pages = data?.pages ?? Math.max(1, Math.ceil(total / size))
  return { items, total, page, pages }
}

// Recherche + pagination côté navigateur, utilisées quand l'API renvoie un tableau simple.
// `searchKeys` : champs du produit/élément dans lesquels chercher `q`.
export function paginateLocally(items, { page = 1, per_page = 10, q, filters = {}, searchKeys = [] } = {}) {
  let rows = items
  const needle = (q ?? '').toString().trim().toLowerCase()
  if (needle) {
    rows = rows.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(needle)),
    )
  }
  for (const [key, value] of Object.entries(filters)) {
    if (value === '' || value == null) continue
    rows = rows.filter((r) => String(r[key] ?? '') === String(value))
  }
  const total = rows.length
  const pages = Math.max(1, Math.ceil(total / per_page))
  const current = Math.min(Math.max(1, page), pages)
  const start = (current - 1) * per_page
  return { items: rows.slice(start, start + per_page), total, page: current, pages }
}

// CRUD générique.
// NB : côté Flask, les routes de collection sont déclarées avec un "/" final
// (ex. /api/products/) ; on l'utilise pour éviter une redirection 308 à chaque appel.
const crud = (path, { searchKeys = ['name'], filterKeys = [] } = {}) => ({
  list: async (params = {}) => {
    const { page, per_page, q, ...rest } = params
    const server = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== '' && v != null))
    const { data } = await client.get(`${path}/`, { params: server })
    if (Array.isArray(data)) {
      const filters = Object.fromEntries(filterKeys.filter((k) => k in server).map((k) => [k, server[k]]))
      return paginateLocally(data, { page, per_page: per_page ?? 10, q, filters, searchKeys })
    }
    return normalizePage(data, per_page)
  },
  get: (id) => client.get(`${path}/${id}`).then((r) => r.data),
  create: (payload) => client.post(`${path}/`, payload).then((r) => r.data),
  update: (id, payload) => client.put(`${path}/${id}`, payload).then((r) => r.data),
  remove: (id) => client.delete(`${path}/${id}`).then((r) => r.data),
})

// --- Ressources disponibles côté backend ---
export const products = crud('/products', {
  searchKeys: ['name', 'sku'],
  filterKeys: ['category_id'],
})
export const categories = crud('/categories', { searchKeys: ['name', 'description'] })
export const users = crud('/users', { searchKeys: ['full_name', 'email'] })

// --- Ressources prévues au cahier des charges, pas encore exposées par l'API ---
// (le frontend gère proprement l'erreur 404 : voir errorMessage et isNotAvailable)
export const suppliers = crud('/suppliers', { searchKeys: ['name'] })
// Stock par entrepôt : le backend expose /api/warehouse-stocks/ (toutes les lignes
// { id, warehouse_id, product_id, quantity }), sans noms de produits ni filtre.
export const warehouseStocks = {
  list: () => client.get('/warehouse-stocks/').then((r) => r.data),
}

export const warehouses = {
  ...crud('/warehouses', { searchKeys: ['name', 'location'] }),
  // Stock d'un entrepôt : lignes filtrées côté client et enrichies avec le SKU / nom du produit
  stock: async (id) => {
    const [rows, prods] = await Promise.all([
      warehouseStocks.list(),
      client.get('/products/').then((r) => r.data),
    ])
    const byId = new Map(prods.map((p) => [p.id, p]))
    const items = rows
      .filter((r) => r.warehouse_id === id)
      .map((r) => ({
        ...r,
        sku: byId.get(r.product_id)?.sku,
        product_name: byId.get(r.product_id)?.name,
      }))
    return { items, total: items.length, page: 1, pages: 1 }
  },
}

// Liste simple (tableau ou objet paginé) avec pagination côté client si l'API renvoie un tableau
const listOf = (path, { searchKeys = [], decorate = (x) => x } = {}) => async (params = {}) => {
  const { page, per_page, q, ...rest } = params
  const server = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== '' && v != null))
  const { data } = await client.get(`${path}/`, { params: server })
  if (Array.isArray(data)) {
    return paginateLocally(data.map(decorate), { page, per_page: per_page ?? 10, q, searchKeys })
  }
  return normalizePage(data, per_page)
}

export const movements = {
  list: listOf('/movements'),
  create: (payload) => client.post('/movements/', payload).then((r) => r.data),
}

// Une alerte = un produit sous son seuil dans un entrepôt (pas d'id côté API : on en fabrique un pour React)
export const alerts = {
  list: listOf('/alerts', {
    decorate: (a) => ({ ...a, id: a.id ?? `${a.product_id}-${a.warehouse_id}` }),
  }),
}
export const auditLogs = { list: listOf('/audit-logs') }

export const dashboard = {
  stats: () => client.get('/dashboard/stats').then((r) => r.data),
}

// Télécharge un export (CSV, PDF) en conservant le jeton d'authentification
export async function downloadFile(path, filename) {
  const res = await client.get(path, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
