import { useState } from 'react'
import CrudPage from '../components/CrudPage'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { Alert } from '../components/ui'
import { warehouses } from '../api/resources'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { ROLES } from '../utils/constants'
import { btn } from '../utils/styles'
import { formatNumber } from '../utils/format'

function StockModal({ warehouse, onClose }) {
  const { data, loading, error } = useFetch(() => warehouses.stock(warehouse.id), [warehouse.id])
  return (
    <Modal title={`Stock — ${warehouse.name}`} onClose={onClose} wide>
      <Alert>{error}</Alert>
      <DataTable
        loading={loading}
        rows={data?.items ?? []}
        empty="Aucun produit en stock dans cet entrepôt."
        columns={[
          { key: 'sku', label: 'SKU', render: (r) => r.sku ?? r.product?.sku ?? '—' },
          { key: 'name', label: 'Produit', render: (r) => r.product_name ?? r.product?.name ?? r.name ?? '—' },
          { key: 'quantity', label: 'Quantité', render: (r) => formatNumber(r.quantity) },
        ]}
      />
    </Modal>
  )
}

export default function Warehouses() {
  const { hasRole } = useAuth()
  const [viewing, setViewing] = useState(null)
  return (
    <>
      <CrudPage
        title="Entrepôts"
        singular="un entrepôt"
        api={warehouses}
        canWrite={hasRole(ROLES.ADMIN)} // seul l'administrateur gère les entrepôts
        columns={[
          { key: 'name', label: 'Nom' },
          { key: 'location', label: 'Localisation' },
        ]}
        fields={[
          { name: 'name', label: 'Nom', required: true },
          { name: 'location', label: 'Localisation' },
          { name: 'description', label: 'Description', type: 'textarea' },
        ]}
        rowActions={(row) => (
          <button className={btn.link} onClick={() => setViewing(row)}>
            Voir le stock
          </button>
        )}
      />
      {viewing && <StockModal warehouse={viewing} onClose={() => setViewing(null)} />}
    </>
  )
}
