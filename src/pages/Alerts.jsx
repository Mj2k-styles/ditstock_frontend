import { useState } from 'react'
import { Link } from 'react-router-dom'
import { alerts } from '../api/resources'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import { Alert, Badge, PageHeader } from '../components/ui'
import { useFetch } from '../hooks/useFetch'
import { PER_PAGE } from '../utils/constants'
import { formatNumber, stockState } from '../utils/format'

export default function Alerts() {
  const [page, setPage] = useState(1)
  const { data, loading, error } = useFetch(() => alerts.list({ page, per_page: PER_PAGE }), [page])

  return (
    <>
      <PageHeader title="Alertes de stock">
        <Link to="/mouvements" className="text-sm font-medium text-brand hover:underline">
          Enregistrer une entrée
        </Link>
      </PageHeader>
      <Alert>{error}</Alert>
      <DataTable
        loading={loading}
        rows={data?.items ?? []}
        empty="Aucun produit sous son seuil minimal."
        columns={[
          { key: 'product_name', label: 'Produit' },
          { key: 'warehouse_name', label: 'Entrepôt' },
          { key: 'stock', label: 'Stock actuel', render: (p) => formatNumber(p.quantity) },
          { key: 'minimum_stock', label: 'Seuil minimal', render: (p) => formatNumber(p.minimum_stock) },
          {
            key: 'etat',
            label: 'État',
            render: (p) =>
              stockState(p) === 'rupture' ? <Badge tone="danger">Rupture</Badge> : <Badge tone="warn">Sous le seuil</Badge>,
          },
        ]}
      />
      {data && <Pagination page={page} pages={data.pages} total={data.total} onChange={setPage} />}
    </>
  )
}
