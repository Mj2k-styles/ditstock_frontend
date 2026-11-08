import { Spinner } from './ui'

// columns : [{ key, label, render?(row), className? }]
export default function DataTable({ columns, rows, loading, empty = 'Aucun élément à afficher.' }) {
  if (loading) return <Spinner />
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-surface text-muted">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-2.5 font-medium ${c.className ?? ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="border-b border-line last:border-0">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-2.5 ${c.className ?? ''}`}>
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
