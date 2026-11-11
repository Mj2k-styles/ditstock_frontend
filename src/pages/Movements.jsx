import { useState } from 'react'
import { movements, products } from '../api/resources'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import { Alert, Badge, Field, PageHeader, Select } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { useLookups } from '../hooks/useLookups'
import { MOVEMENT_TYPES, PER_PAGE, ROLES } from '../utils/constants'
import { NOT_AVAILABLE_MESSAGE, errorMessage, formatDate, formatNumber } from '../utils/format'
import { btn, inputClass } from '../utils/styles'

const SORTIE_MOTIFS = ['Vente', 'Consommation', 'Perte'].map((m) => ({ value: m, label: m }))
const TYPE_TONE = { ENTREE: 'ok', SORTIE: 'warn', TRANSFERT: 'neutral', AJUSTEMENT: 'danger' }
const EMPTY = { product_id: '', warehouse_id: '', warehouse_dest_id: '', quantity: '', reason: '', reference: '' }

function MovementForm({ onSaved }) {
  const { hasRole } = useAuth()
  const lookups = useLookups()
  const { data: productPage } = useFetch(() => products.list({ per_page: 200 }))
  const productOptions = (productPage?.items ?? []).map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }))

  // Le magasinier ne fait que des entrées et sorties ; transferts et ajustements : gestionnaire / admin
  const manager = hasRole(ROLES.ADMIN, ROLES.GESTIONNAIRE)
  const types = manager ? Object.keys(MOVEMENT_TYPES) : ['ENTREE', 'SORTIE']

  const [type, setType] = useState('ENTREE')
  const [values, setValues] = useState(EMPTY)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    const payload = {
      type,
      product_id: values.product_id,
      warehouse_id: values.warehouse_id,
      quantity: Number(values.quantity),
      reason: values.reason || null,
      reference: values.reference || null,
    }
    if (type === 'TRANSFERT') payload.warehouse_dest_id = values.warehouse_dest_id
    try {
      await movements.create(payload)
      setSuccess(`${MOVEMENT_TYPES[type]} enregistrée.`)
      setValues(EMPTY)
      onSaved()
    } catch (err) {
      // ex. « stock insuffisant » renvoyé par le backend pour une sortie trop grande
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-line bg-white p-4">
      <div role="tablist" aria-label="Type de mouvement" className="mb-4 flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={type === t}
            onClick={() => {
              setType(t)
              setError('')
              setSuccess('')
            }}
            className={`rounded px-3 py-1.5 text-sm ${type === t ? 'bg-brand text-white' : 'border border-line hover:bg-surface'}`}
          >
            {MOVEMENT_TYPES[t]}
          </button>
        ))}
      </div>

      <Alert>{error}</Alert>
      <Alert tone="ok">{success}</Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Produit" htmlFor="m-product">
          <Select id="m-product" required value={values.product_id} onChange={(v) => set('product_id', v)} options={productOptions} placeholder="— Choisir —" />
        </Field>
        <Field label={type === 'TRANSFERT' ? 'Entrepôt source' : 'Entrepôt'} htmlFor="m-wh">
          <Select id="m-wh" required value={values.warehouse_id} onChange={(v) => set('warehouse_id', v)} options={lookups.warehouses} placeholder="— Choisir —" />
        </Field>
        {type === 'TRANSFERT' && (
          <Field label="Entrepôt de destination" htmlFor="m-dest">
            <Select id="m-dest" required value={values.warehouse_dest_id} onChange={(v) => set('warehouse_dest_id', v)} options={lookups.warehouses.filter((w) => w.value !== values.warehouse_id)} placeholder="— Choisir —" />
          </Field>
        )}
        <Field
          label={type === 'AJUSTEMENT' ? 'Écart constaté' : 'Quantité'}
          htmlFor="m-qty"
          help={type === 'AJUSTEMENT' ? 'Positif pour ajouter, négatif pour retirer.' : undefined}
        >
          <input id="m-qty" type="number" required step="1" min={type === 'AJUSTEMENT' ? undefined : 1} value={values.quantity} onChange={(e) => set('quantity', e.target.value)} className={inputClass} />
        </Field>
        {type === 'SORTIE' && (
          <Field label="Motif" htmlFor="m-motif">
            <Select id="m-motif" required value={values.reason} onChange={(v) => set('reason', v)} options={SORTIE_MOTIFS} placeholder="— Choisir —" />
          </Field>
        )}
        {type === 'AJUSTEMENT' && (
          <Field label="Motif de l'ajustement" htmlFor="m-motif">
            <input id="m-motif" required value={values.reason} onChange={(e) => set('reason', e.target.value)} className={inputClass} />
          </Field>
        )}
        {type === 'ENTREE' && (
          <Field label="Référence du bon" htmlFor="m-ref">
            <input id="m-ref" value={values.reference} onChange={(e) => set('reference', e.target.value)} className={inputClass} />
          </Field>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button type="submit" className={btn.primary} disabled={saving}>
          {saving ? 'Enregistrement…' : `Enregistrer ${type === 'ENTREE' ? "l'entrée" : type === 'SORTIE' ? 'la sortie' : type === 'TRANSFERT' ? 'le transfert' : "l'ajustement"}`}
        </button>
      </div>
    </form>
  )
}

export default function Movements() {
  const lookups = useLookups()
  const [filters, setFilters] = useState({ type: '', warehouse_id: '', date_from: '', date_to: '' })
  const [page, setPage] = useState(1)
  const setFilter = (name, value) => {
    setPage(1)
    setFilters((f) => ({ ...f, [name]: value }))
  }

  const { data, loading, error, reload } = useFetch(() => {
    const params = { page, per_page: PER_PAGE }
    for (const [k, v] of Object.entries(filters)) if (v !== '') params[k] = v
    return movements.list(params)
  }, [page, filters])

  const typeOptions = Object.entries(MOVEMENT_TYPES).map(([value, label]) => ({ value, label }))

  // Garde-fou : si /api/movements/ est absent (404), inutile de proposer un formulaire qui échouerait
  if (error === NOT_AVAILABLE_MESSAGE) {
    return (
      <>
        <PageHeader title="Mouvements de stock" />
        <Alert tone="warn">
          Le module « mouvements » n&apos;est pas encore disponible sur le serveur. L&apos;enregistrement des
          entrées, sorties, transferts et ajustements sera activé dès que l&apos;API existera.
        </Alert>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Mouvements de stock" />
      {!(loading && !data) && <MovementForm onSaved={() => (page === 1 ? reload() : setPage(1))} />}

      <h2 className="mb-3 font-medium">Historique</h2>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select aria-label="Type" value={filters.type} onChange={(v) => setFilter('type', v)} options={typeOptions} placeholder="Tous les types" />
        <Select aria-label="Entrepôt" value={filters.warehouse_id} onChange={(v) => setFilter('warehouse_id', v)} options={lookups.warehouses} placeholder="Tous les entrepôts" />
        <input type="date" aria-label="Du" value={filters.date_from} onChange={(e) => setFilter('date_from', e.target.value)} className={inputClass} />
        <input type="date" aria-label="Au" value={filters.date_to} onChange={(e) => setFilter('date_to', e.target.value)} className={inputClass} />
      </div>

      <Alert>{error}</Alert>
      <DataTable
        loading={loading}
        rows={data?.items ?? []}
        empty="Aucun mouvement enregistré."
        columns={[
          { key: 'created_at', label: 'Date', render: (m) => formatDate(m.created_at) },
          { key: 'type', label: 'Type', render: (m) => <Badge tone={TYPE_TONE[m.type]}>{MOVEMENT_TYPES[m.type] ?? m.type}</Badge> },
          { key: 'product', label: 'Produit', render: (m) => m.product_name ?? m.product?.name ?? m.product_id },
          {
            key: 'warehouse',
            label: 'Entrepôt',
            render: (m) => {
              const source = m.warehouse_name ?? m.warehouse?.name ?? m.warehouse_id
              // Un transfert part d'un entrepôt source vers un entrepôt de destination
              return m.type === 'TRANSFERT' ? `${source} → ${m.warehouse_dest_name ?? m.warehouse_dest_id}` : source
            },
          },
          {
            key: 'quantity',
            label: 'Quantité',
            // Pour un ajustement, la quantité est un écart : on affiche son signe
            render: (m) => (m.type === 'AJUSTEMENT' && m.quantity > 0 ? `+${formatNumber(m.quantity)}` : formatNumber(m.quantity)),
          },
          { key: 'reason', label: 'Motif / bon', render: (m) => m.reason || m.reference || '—' },
          { key: 'user', label: 'Utilisateur', render: (m) => m.user_name ?? m.user?.full_name ?? m.user_id },
        ]}
      />
      {data && <Pagination page={page} pages={data.pages} total={data.total} onChange={setPage} />}
    </>
  )
}
