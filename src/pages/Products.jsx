import { useRef, useState } from 'react'
import { movements, products } from '../api/resources'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
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

const STATE_OPTIONS = Object.entries(STATE_BADGE).map(([value, [, label]]) => ({ value, label }))

const EMPTY_FILTERS = { q: '', category_id: '', supplier_id: '', warehouse_id: '', stock_state: '' }

// Modèle de fichier proposé au téléchargement pour l'import
const CSV_TEMPLATE =
  'sku;nom;description;unite;prix_achat;prix_vente;seuil_min;categorie;fournisseur\n' +
  'INFO-010;Clavier USB;Clavier AZERTY filaire;pièce;8000;12000;10;Informatique;Dakar Informatique\n'

function ImportReport({ report, onClose }) {
  const problems = [
    ...report.skipped.map((s) => ({ line: s.line, sku: s.sku, text: s.reason })),
    ...report.errors.map((e) => ({
      line: e.line,
      sku: e.sku,
      text: Object.entries(e.errors)
        .map(([field, messages]) => `${field} : ${[].concat(messages).join(', ')}`)
        .join(' ; '),
    })),
  ].sort((a, b) => a.line - b.line)

  return (
    <Modal title="Résultat de l'import" onClose={onClose} wide>
      <p className="mb-3">
        <strong>{report.created}</strong> produit(s) créé(s), {report.skipped.length} ignoré(s),{' '}
        {report.errors.length} ligne(s) en erreur.
      </p>
      {problems.length > 0 && (
        <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
          {problems.map((p) => (
            <li key={`${p.line}-${p.sku}`}>
              <span className="font-medium">Ligne {p.line}</span>
              {p.sku ? ` (${p.sku})` : ''} : {p.text}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex justify-end">
        <button className={btn.primary} onClick={onClose}>
          Fermer
        </button>
      </div>
    </Modal>
  )
}

export default function Products() {
  const { hasRole } = useAuth()

  // Création, modification, archivage et import réservés à l'admin et au gestionnaire.
  const canWrite = hasRole(ROLES.ADMIN, ROLES.GESTIONNAIRE)
  const lookups = useLookups()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [actionError, setActionError] = useState('')
  const [report, setReport] = useState(null)
  const [importing, setImporting] = useState(false)
  const fileInput = useRef(null)

  const setFilter = (name, value) => {
    setPage(1)
    setFilters((f) => ({ ...f, [name]: value }))
  }

  // Recherche, filtres et pagination faits par le serveur (stock_total inclus).
  const { data, loading, error, reload } = useFetch(
    () => products.list({ page, per_page: PER_PAGE, ...filters }),
    [page, filters],
  )

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

  // Import CSV : le rapport liste les lignes ignorées ou en erreur.
  async function importFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setActionError('')
    setImporting(true)
    try {
      setReport(await products.importCsv(file))
      reload()
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setImporting(false)
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob(['﻿' + CSV_TEMPLATE], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'modele-import-produits.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Champs du formulaire produit (cahier des charges, F2.1).
  const fields = [
    { name: 'sku', label: 'Référence (SKU)', required: true },
    { name: 'name', label: 'Nom', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'category_id', label: 'Catégorie', type: 'select', options: lookups.categories },
    { name: 'supplier_id', label: 'Fournisseur', type: 'select', options: lookups.suppliers },
    { name: 'unit', label: 'Unité', required: true, help: 'pièce, kg, litre, carton…' },
    { name: 'unit_price', label: "Prix d'achat (FCFA)", type: 'number', step: '0.01', required: true },
    { name: 'sale_price', label: 'Prix de vente (FCFA)', type: 'number', step: '0.01' },
    { name: 'minimum_stock', label: 'Seuil minimal', type: 'number', step: '1', required: true },
    { name: 'image_url', label: "Adresse de l'image", type: 'url', help: 'Lien http(s) vers une photo du produit.' },

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

  const nameOf = (list, id) => list.find((c) => c.value === id)?.label ?? '—'

  // Colonnes du tableau des produits.
  const columns = [
    {
      key: 'image_url',
      label: '',
      className: 'w-12',
      render: (p) =>
        p.image_url ? (
          <img src={p.image_url} alt="" loading="lazy" className="h-9 w-9 rounded object-cover" />
        ) : (
          <span className="block h-9 w-9 rounded bg-surface" aria-hidden="true" />
        ),
    },
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Produit' },
    { key: 'category_id', label: 'Catégorie', render: (p) => nameOf(lookups.categories, p.category_id) },
    { key: 'supplier_id', label: 'Fournisseur', render: (p) => nameOf(lookups.suppliers, p.supplier_id) },
    { key: 'unit_price', label: "Prix d'achat", render: (p) => formatMoney(p.unit_price) },
    {
      key: 'sale_price',
      label: 'Prix de vente',
      render: (p) => (p.sale_price == null ? '—' : formatMoney(p.sale_price)),
    },
    { key: 'minimum_stock', label: 'Seuil', render: (p) => formatNumber(p.minimum_stock) },
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
          <span className="flex items-center gap-2 whitespace-nowrap">
            {formatNumber(p.stock_total)} {p.unit}
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
          <button className={btn.link} onClick={() => setEditing(p)}>
            Modifier
          </button>

          <button className="text-sm text-danger hover:underline" onClick={() => archive(p)}>
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
          <div className="flex flex-wrap gap-2">
            <button className={btn.secondary} onClick={downloadTemplate}>
              Modèle CSV
            </button>
            <button className={btn.secondary} onClick={() => fileInput.current?.click()} disabled={importing}>
              {importing ? 'Import…' : 'Importer un CSV'}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              aria-label="Fichier CSV de produits"
              className="hidden"
              onChange={importFile}
            />
            <button className={btn.primary} onClick={() => setEditing({ unit: 'pièce' })}>
              Ajouter un produit
            </button>
          </div>
        )}
      </PageHeader>

      {/* Filtres de recherche (appliqués par le serveur) */}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
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
        <Select
          aria-label="Fournisseur"
          value={filters.supplier_id}
          onChange={(v) => setFilter('supplier_id', v)}
          options={lookups.suppliers}
          placeholder="Tous les fournisseurs"
        />
        <Select
          aria-label="Entrepôt"
          value={filters.warehouse_id}
          onChange={(v) => setFilter('warehouse_id', v)}
          options={lookups.warehouses}
          placeholder="Tous les entrepôts"
        />
        <Select
          aria-label="État du stock"
          value={filters.stock_state}
          onChange={(v) => setFilter('stock_state', v)}
          options={STATE_OPTIONS}
          placeholder="Tous les états"
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
      {data && <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}

      {report && <ImportReport report={report} onClose={() => setReport(null)} />}

      {/* Formulaire de création et de modification */}
      {editing && (
        <RecordForm
          title={editing.id ? 'Modifier le produit' : 'Ajouter un produit'}
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
                const name = lookups.warehouses.find((w) => w.value === line.warehouse_id)?.label

                failures.push(`${name ?? `entrepôt ${line.warehouse_id}`} : ${errorMessage(err)}`)
              }
            }

            // Affichage des éventuelles erreurs de stock.
            if (failures.length) {
              setActionError(
                `Produit « ${created.name} » créé, mais son stock initial n'a pas été enregistré (${failures.join(' ; ')}).`,
              )
            }

            reload()
          }}
        />
      )}
    </>
  )
}
