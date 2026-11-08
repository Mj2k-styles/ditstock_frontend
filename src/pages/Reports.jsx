import { useState } from 'react'
import { downloadFile } from '../api/resources'
import { Alert, PageHeader } from '../components/ui'
import { errorMessage } from '../utils/format'
import { btn } from '../utils/styles'

const EXPORTS = [
  { path: '/reports/stock.csv', file: 'etat-du-stock.csv', label: "État du stock (CSV)" },
  { path: '/reports/stock.pdf', file: 'etat-du-stock.pdf', label: "État du stock (PDF)" },
  { path: '/reports/movements.csv', file: 'mouvements.csv', label: 'Mouvements (CSV)' },
  { path: '/reports/movements.pdf', file: 'mouvements.pdf', label: 'Mouvements (PDF)' },
]

export default function Reports() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  async function run(item) {
    setError('')
    setBusy(item.path)
    try {
      await downloadFile(item.path, item.file)
    } catch (err) {
      setError(errorMessage(err, "L'export a échoué."))
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <PageHeader title="Rapports" />
      <Alert>{error}</Alert>
      <div className="grid max-w-xl gap-3 sm:grid-cols-2">
        {EXPORTS.map((item) => (
          <button key={item.path} className={btn.secondary} disabled={busy === item.path} onClick={() => run(item)}>
            {busy === item.path ? 'Téléchargement…' : item.label}
          </button>
        ))}
      </div>
    </>
  )
}
