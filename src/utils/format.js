const money = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
})
const dateTime = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export const formatMoney = (n) => money.format(Number(n) || 0)
export const formatNumber = (n) => new Intl.NumberFormat('fr-FR').format(Number(n) || 0)
export const formatDate = (iso) => (iso ? dateTime.format(new Date(iso)) : '—')

// Le backend répond 404 « The requested URL was not found… » quand une route n'existe pas encore
// (≠ 404 métier, qui renvoie un message en français comme « Produit introuvable »).
// Selon le cas, Flask répond en JSON ({ message }) ou avec une page HTML « Not Found » (route absente).
export function isNotAvailable(err) {
  if (err?.response?.status !== 404) return false
  const d = err.response.data
  const text = typeof d === 'string' ? d : (d?.message ?? '')
  return /requested URL|Not Found/i.test(text)
}

export const NOT_AVAILABLE_MESSAGE =
  "Cette fonctionnalité n'est pas encore disponible sur le serveur."

// Message d'erreur lisible à partir d'une erreur Axios
export function errorMessage(err, fallback = 'Une erreur est survenue. Réessayez.') {
  const d = err?.response?.data
  if (!err?.response) return 'Impossible de joindre le serveur.'
  if (isNotAvailable(err)) return NOT_AVAILABLE_MESSAGE
  if (typeof d === 'string') return d
  if (d?.message) return d.message
  if (d?.error) return d.error
  if (d?.errors && typeof d.errors === 'object') {
    return Object.entries(d.errors)
      .map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(', ') : v}`)
      .join(' · ')
  }
  return fallback
}

// État du stock d'un produit : ok | alerte | rupture | null (quantité inconnue).
// Le backend n'expose pas encore la quantité en stock : sans `stock_total`, on n'affiche rien
// plutôt que de marquer tous les produits en « rupture ».
export function stockState(p) {
  const raw = p.stock_total ?? p.quantity ?? p.quantite
  if (raw == null) return null
  const qty = Number(raw)
  const min = Number(p.minimum_stock ?? 0)
  if (qty <= 0) return 'rupture'
  if (qty < min) return 'alerte'
  return 'ok'
}
