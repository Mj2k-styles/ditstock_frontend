
import { useState } from 'react'
import { movements, products, warehouseStocks } from '../api/resources'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import RecordForm from '../components/RecordForm'
import { Alert, Badge, PageHeader, Select } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { useLookups } from '../hooks/useLookups'
import { ROLES, PER_PAGE } from '../utils/constants'
import { errorMessage, formatMoney, formatNumber, stockState } from '../utils/format'
import { btn, inputClass } from '../utils/styles'

const STATE_BADGE = {
  ok: ['ok', 'Normal'],
  alerte: ['warn', 'Sous le seuil'],
  rupture: ['danger', 'Rupture'],
}

export default function Products() {
  const { hasRole } = useAuth()

  // Création, modification et archivage réservés à l'admin et au gestionnaire.
  const canWrite = hasRole(ROLES.ADMIN, ROLES.GESTIONNAIRE)
  const lookups = useLookups()

  const [filters, setFilters] = useState({ q: '', category_id: '' })
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [actionError, setActionError] = useState('')

  const setFilter = (name, value) => {
    setPage(1)
    setFilters((f) => ({ ...f, [name]: value }))
  }

  // Récupération des produits et calcul du stock total par produit.
  const { data, loading, error, reload } = useFetch(() => {
    const params = { page, per_page: PER_PAGE }

    for (const [k, v] of Object.entries(filters)) {
      if (v !== '') params[k] = v
    }

    return products.list(params).then(async (res) => {
      try {
        const totals = new Map()

        for (const s of await warehouseStocks.list()) {
          totals.set(
            s.product_id,
            (totals.get(s.product_id) ?? 0) + s.quantity
          )
        }

        return {
          ...res,
          items: res.items.map((p) => ({
            ...p,
            stock_total: totals.get(p.id) ?? 0,
          })),
        }
      } catch {
        return res
      }
    })
  }, [page, filters])

  // Archivage d'un produit.
  async function archive(p) {
    if (!window.confirm(`Archiver « ${p.name} » ?`)) return

    setActionError('')

    try {
      await products.remove(p.id)
      reload()
    } catch (err) {
      setActionError(errorMessage(err))
    }
  }

  // Champs du formulaire produit.
  const fields = [
    {
      name: 'sku',
      label: 'Référence (SKU)',
      required: true,
    },
    {
      name: 'name',
      label: 'Nom',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
    },
    {
      name: 'category_id',
      label: 'Catégorie',
      type: 'select',
      options: lookups.categories,
    },
    {
      name: 'unit_price',
      label: 'Prix unitaire (FCFA)',
      type: 'number',
      step: '0.01',
      required: true,
    },
    {
      name: 'minimum_stock',
      label: 'Seuil minimal',
      type: 'number',
      step: '1',
      required: true,
    },

    // Le stock initial est enregistré comme un mouvement d'entrée.
    {
      name: 'initial_stock',
      label: 'Stock initial',
      type: 'quantities',
      onlyNew: true,
      options: lookups.warehouses,
      emptyText:
        'Aucun entrepôt : créez-en un dans « Entrepôts » pour pouvoir saisir un stock.',
      help:
        "Quantité reçue dans chaque entrepôt. Laissez vide s'il n'y a pas encore de stock.",
    },
  ]

  const categoryName = (id) =>
    lookups.categories.find((c) => c.value === id)?.label ?? '—'

  // Colonnes du tableau des produits.
  const columns = [
    {
      key: 'sku',
      label: 'SKU',
    },
    {
      key: 'name',
      label: 'Produit',
    },
    {
      key: 'category_id',
      label: 'Catégorie',
      render: (p) => categoryName(p.category_id),
    },
    {
      key: 'unit_price',
      label: 'Prix unitaire',
      render: (p) => formatMoney(p.unit_price),
    },
    {
      key: 'minimum_stock',
      label: 'Seuil',
      render: (p) => formatNumber(p.minimum_stock),
    },
    {
      key: 'etat',
      label: 'Stock',
      render: (p) => {
        const state = stockState(p)

        if (!state) {
          return <span className="text-muted">—</span>
        }

        const [tone, label] = STATE_BADGE[state]

        return (
          <span className="flex items-center gap-2">
            {formatNumber(p.stock_total ?? p.quantity)}
            <Badge tone={tone}>{label}</Badge>
          </span>
        )
      },
    },
  ]

  // Actions disponibles selon le rôle de l'utilisateur.
  if (canWrite) {
    columns.push({
      key: '_actions',
      label: '',
      className: 'text-right whitespace-nowrap',
      render: (p) => (
        <div className="flex justify-end gap-3">
          <button
            className={btn.link}
            onClick={() => setEditing(p)}
          >
            Modifier
          </button>

          <button
            className="text-sm text-danger hover:underline"
            onClick={() => archive(p)}
          >
            Archiver
          </button>
        </div>
      ),
    })
  }

  return (
    <>
      <PageHeader title="Produits">
        {canWrite && (
          <button
            className={btn.primary}
            onClick={() => setEditing({})}
          >
            Ajouter un produit
          </button>
        )}
      </PageHeader>

      {/* Filtres de recherche */}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <input
          type="search"
          aria-label="Rechercher un produit"
          placeholder="Nom ou SKU…"
          value={filters.q}
          onChange={(e) => setFilter('q', e.target.value)}
          className={inputClass}
        />

        <Select
          aria-label="Catégorie"
          value={filters.category_id}
          onChange={(v) => setFilter('category_id', v)}
          options={lookups.categories}
          placeholder="Toutes les catégories"
        />
      </div>

      {/* Messages d'erreur */}
      <Alert>{error || actionError}</Alert>

      {/* Tableau des produits */}
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        loading={loading}
        empty="Aucun produit ne correspond à la recherche."
      />

      {/* Pagination */}
      {data && (
        <Pagination
          page={data.page}
          pages={data.pages}
          total={data.total}
          onChange={setPage}
        />
      )}

      {/* Formulaire de création et de modification */}
      {editing && (
        <RecordForm
          title={
            editing.id ? 'Modifier le produit' : 'Ajouter un produit'
          }
          fields={fields}
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={async ({ initial_stock = [], ...payload }) => {
            // Modification d'un produit existant.
            if (editing.id) {
              await products.update(editing.id, payload)
              reload()
              return
            }

            setActionError('')

            // Création du produit sans envoyer initial_stock à ProductSchema.
            const created = await products.create(payload)

            // Enregistrement du stock initial comme mouvements d'entrée.
            const failures = []

            for (const line of initial_stock) {
              try {
                await movements.create({
                  type: 'ENTREE',
                  product_id: created.id,
                  warehouse_id: line.warehouse_id,
                  quantity: line.quantity,
                  reason: null,
                  reference: 'Stock initial',
                })
              } catch (err) {
                const name = lookups.warehouses.find(
                  (w) => w.value === line.warehouse_id
                )?.label

                failures.push(
                  `${name ?? `entrepôt ${line.warehouse_id}`} : ${errorMessage(err)}`
                )
              }
            }

            // Affichage des éventuelles erreurs de stock.
            if (failures.length) {
              setActionError(
                `Produit « ${created.name} » créé, mais son stock initial n'a pas été enregistré (${failures.join(' ; ')}).`
              )
            }

            reload()
          }}
        />
      )}
    </>
  )
}
