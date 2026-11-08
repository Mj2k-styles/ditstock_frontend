import { useState } from 'react'
import DataTable from './DataTable'
import Pagination from './Pagination'
import RecordForm from './RecordForm'
import { Alert, PageHeader } from './ui'
import { useFetch } from '../hooks/useFetch'
import { btn, inputClass } from '../utils/styles'
import { errorMessage } from '../utils/format'
import { PER_PAGE } from '../utils/constants'

// Page de liste + création / modification / suppression pour un référentiel simple.
export default function CrudPage({
  title,
  singular,
  api,
  columns,
  fields,
  canWrite,
  canDelete = canWrite,
  showDelete = () => true,
  deleteLabel = 'Supprimer',
  rowActions,
}) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null) // {} = création, objet = modification
  const [actionError, setActionError] = useState('')

  const { data, loading, error, reload } = useFetch(
    () => api.list({ page, per_page: PER_PAGE, q: q || undefined }),
    [page, q],
  )

  async function remove(row) {
    if (!window.confirm(`${deleteLabel} « ${row.name ?? row.full_name ?? row.email} » ?`)) return
    setActionError('')
    try {
      await api.remove(row.id)
      reload()
    } catch (err) {
      setActionError(errorMessage(err))
    }
  }

  const allColumns = [
    ...columns,
    {
      key: '_actions',
      label: '',
      className: 'text-right whitespace-nowrap',
      render: (row) => (
        <div className="flex justify-end gap-3">
          {rowActions?.(row)}
          {canWrite && (
            <button className={btn.link} onClick={() => setEditing(row)}>
              Modifier
            </button>
          )}
          {canDelete && showDelete(row) && (
            <button className="text-sm text-danger hover:underline" onClick={() => remove(row)}>
              {deleteLabel}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader title={title}>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            setQ(search)
          }}
        >
          <input
            type="search"
            aria-label="Rechercher"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} w-48`}
          />
          <button className={btn.secondary}>Rechercher</button>
        </form>
        {canWrite && (
          <button className={btn.primary} onClick={() => setEditing({})}>
            Ajouter {singular}
          </button>
        )}
      </PageHeader>

      <Alert>{error || actionError}</Alert>
      <DataTable columns={allColumns} rows={data?.items ?? []} loading={loading} />
      {data && <Pagination page={page} pages={data.pages} total={data.total} onChange={setPage} />}

      {editing && (
        <RecordForm
          title={editing.id ? `Modifier ${singular}` : `Ajouter ${singular}`}
          fields={fields}
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            if (editing.id) await api.update(editing.id, payload)
            else await api.create(payload)
            reload()
          }}
        />
      )}
    </>
  )
}
