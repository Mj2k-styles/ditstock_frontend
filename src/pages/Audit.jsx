import { useState } from 'react'
import { auditLogs } from '../api/resources'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import { Alert, PageHeader } from '../components/ui'
import { useFetch } from '../hooks/useFetch'
import { PER_PAGE } from '../utils/constants'
import { NOT_AVAILABLE_MESSAGE, formatDate } from '../utils/format'

export default function Audit() {
  const [page, setPage] = useState(1)
  const { data, loading, error } = useFetch(() => auditLogs.list({ page, per_page: PER_PAGE }), [page])

  return (
    <>
      <PageHeader title="Journal d'audit" />
      <Alert tone={error === NOT_AVAILABLE_MESSAGE ? 'warn' : 'danger'}>{error}</Alert>
      <DataTable
        loading={loading}
        rows={data?.items ?? []}
        empty="Aucune action enregistrée."
        columns={[
          { key: 'created_at', label: 'Date', render: (l) => formatDate(l.created_at) },
          { key: 'user', label: 'Utilisateur', render: (l) => l.user_name ?? l.user?.full_name ?? l.user_id },
          { key: 'action', label: 'Action' },
          { key: 'entity', label: 'Élément', render: (l) => `${l.entity ?? ''} ${l.entity_id ?? ''}`.trim() || '—' },
          { key: 'details', label: 'Détails', render: (l) => <code className="text-xs">{l.details ? JSON.stringify(l.details) : '—'}</code> },
        ]}
      />
      {data && <Pagination page={page} pages={data.pages} total={data.total} onChange={setPage} />}
    </>
  )
}
