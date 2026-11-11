import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { dashboard, products } from '../api/resources'
import { useFetch } from '../hooks/useFetch'
import { Alert, PageHeader, Spinner } from '../components/ui'
import { MOVEMENT_TYPES } from '../utils/constants'
import { formatMoney, formatNumber, isNotAvailable } from '../utils/format'

// Une courbe par type de mouvement (couleurs alignées sur les badges de la page Mouvements)
const LINE_COLORS = { ENTREE: '#0e6f63', SORTIE: '#d97706', TRANSFERT: '#2563eb', AJUSTEMENT: '#dc2626' }

// 'AAAA-MM-JJ' (envoyé par l'API) -> 'JJ/MM' pour l'axe, 'JJ/MM/AAAA' pour l'infobulle
const shortDate = (d) => (typeof d === 'string' ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : d)
const longDate = (d) => (typeof d === 'string' ? `${shortDate(d)}/${d.slice(0, 4)}` : d)

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone ?? ''}`}>{value}</p>
    </div>
  )
}

export default function Dashboard() {
  // Si /api/dashboard/stats est indisponible, on affiche au moins le nombre de produits
  const { data, loading, error } = useFetch(async () => {
    let stats
    try {
      stats = await dashboard.stats()
    } catch (err) {
      if (!isNotAvailable(err)) throw err
      const list = await products.list({ per_page: 1000 })
      return { _partial: true, total_products: list.total }
    }
    // Les graphiques viennent de deux autres routes : leur échec ne doit pas masquer les chiffres
    const [movementsRes, topRes] = await Promise.allSettled([dashboard.movements(), dashboard.topExits()])
    return {
      ...stats,
      movements_30d: movementsRes.status === 'fulfilled' ? movementsRes.value : undefined,
      top_products: topRes.status === 'fulfilled' ? topRes.value : undefined,
    }
  })

  if (loading) return <Spinner />
  if (error) return <Alert>{error}</Alert>

  const s = data ?? {}
  const inAlert = Number(s.alerts_count ?? 0)
  const partial = !!s._partial // route des statistiques indisponible
  const hasMovements = s.movements_today != null || Array.isArray(s.movements_30d)

  return (
    <>
      <PageHeader title="Tableau de bord" />

      {partial && (
        <Alert tone="warn">Les statistiques du tableau de bord ne sont pas disponibles sur le serveur.</Alert>
      )}
      {!partial && !hasMovements && (
        <Alert tone="warn">
          Le serveur ne fournit pas les mouvements du jour ni les graphiques (mettez le backend à jour).
        </Alert>
      )}

      {inAlert > 0 && (
        <Alert tone="warn">
          {inAlert} produit(s) sous le seuil minimal.{' '}
          <Link to="/alertes" className="font-medium underline">
            Voir les alertes
          </Link>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Produits" value={formatNumber(s.total_products)} />
        <Stat label="Valeur totale du stock" value={partial ? '—' : formatMoney(s.total_stock_value)} />
        <Stat label="Produits en alerte" value={partial ? '—' : formatNumber(inAlert)} tone={inAlert ? 'text-warn' : ''} />
        <Stat label="Mouvements du jour" value={hasMovements ? formatNumber(s.movements_today) : '—'} />
      </div>

      {hasMovements && (
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="mb-3 font-medium">Mouvements sur 30 jours</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={s.movements_30d ?? []}>
                <CartesianGrid stroke="#dde2e5" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={shortDate} interval="preserveStartEnd" minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip labelFormatter={longDate} />
                <Legend />
                {Object.keys(LINE_COLORS).map((kind) => (
                  <Line key={kind} type="monotone" dataKey={kind} name={MOVEMENT_TYPES[kind]} stroke={LINE_COLORS[kind]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-4">
          <h2 className="mb-3 font-medium">Top 10 des produits sortis (30 jours)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.top_products ?? []} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#dde2e5" strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantity" name="Quantité sortie" fill="#0e6f63" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      )}
    </>
  )
}
