import { useState } from 'react'
import CrudPage from '../components/CrudPage'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { Alert } from '../components/ui'
import { suppliers } from '../api/resources'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { ROLES } from '../utils/constants'
import { formatDate, formatNumber } from '../utils/format'
import { btn } from '../utils/styles'

const HISTORY_PER_PAGE = 10

// Historique des approvisionnements d'un fournisseur (cahier des charges, F4.2)
export function SupplierHistory({ supplier, onClose }) {
  const [page, setPage] = useState(1)
  const { data, loading, error } = useFetch(
    () => suppliers.history(supplier.id, { page, per_page: HISTORY_PER_PAGE }),
    [supplier.id, page],
  )

  return (
    <Modal title={`Approvisionnements — ${supplier.name}`} onClose={onClose} wide>
      <Alert>{error}</Alert>
      <DataTable
        loading={loading}
        rows={data?.items ?? []}
        empty="Aucune entrée de stock enregistrée pour ce fournisseur."
        columns={[
          { key: 'created_at', label: 'Date', render: (m) => formatDate(m.created_at) },
          { key: 'product_name', label: 'Produit', render: (m) => `${m.product_sku} — ${m.product_name}` },
          { key: 'warehouse_name', label: 'Entrepôt' },
          { key: 'quantity', label: 'Quantité', render: (m) => formatNumber(m.quantity) },
          { key: 'reference', label: 'Bon', render: (m) => m.reference || '—' },
        ]}
      />
      {data && <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}
    </Modal>
  )
}

export default function Suppliers() {
  const { hasRole } = useAuth()
  const canWrite = hasRole(ROLES.ADMIN, ROLES.GESTIONNAIRE)
  const [history, setHistory] = useState(null)

  return (
    <>
      <CrudPage
        title="Fournisseurs"
        singular="un fournisseur"
        api={suppliers}
        canWrite={canWrite}
        deleteLabel="Archiver"
        rowActions={(row) => (
          <button className={btn.link} onClick={() => setHistory(row)}>
            Historique
          </button>
        )}
        columns={[
          { key: 'name', label: 'Nom' },
          { key: 'contact', label: 'Contact', render: (s) => s.contact || '—' },
          { key: 'phone', label: 'Téléphone', render: (s) => s.phone || '—' },
          { key: 'email', label: 'E-mail', render: (s) => s.email || '—' },
        ]}
        fields={[
          { name: 'name', label: 'Nom', required: true },
          { name: 'contact', label: 'Personne à contacter' },
          { name: 'phone', label: 'Téléphone', type: 'tel' },
          { name: 'email', label: 'E-mail', type: 'email' },
          { name: 'address', label: 'Adresse', type: 'textarea' },
        ]}
      />
      {history && <SupplierHistory supplier={history} onClose={() => setHistory(null)} />}
    </>
  )
}
