import { categories, suppliers, warehouses } from '../api/resources'
import { useFetch } from './useFetch'

const toOptions = (page) => page.items.map((i) => ({ value: i.id, label: i.name }))

// Listes de référence (catégories, fournisseurs, entrepôts) pour les filtres et formulaires.
// allSettled : si un référentiel n'existe pas encore côté API (fournisseurs, entrepôts),
// les autres restent utilisables.
export function useLookups() {
  const { data } = useFetch(async () => {
    const params = { per_page: 200 }
    const [c, s, w] = await Promise.allSettled([
      categories.list(params),
      suppliers.list(params),
      warehouses.list(params),
    ])
    const opts = (r) => (r.status === 'fulfilled' ? toOptions(r.value) : [])
    return { categories: opts(c), suppliers: opts(s), warehouses: opts(w) }
  })
  return data ?? { categories: [], suppliers: [], warehouses: [] }
}
