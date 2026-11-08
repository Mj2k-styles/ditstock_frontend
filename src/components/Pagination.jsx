import { btn } from '../utils/styles'

export default function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) {
    return total ? <p className="mt-3 text-sm text-muted">{total} résultat(s)</p> : null
  }
  return (
    <div className="mt-3 flex items-center justify-between text-sm">
      <span className="text-muted">{total} résultat(s)</span>
      <div className="flex items-center gap-2">
        <button className={btn.secondary} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Précédent
        </button>
        <span>
          Page {page} sur {pages}
        </span>
        <button className={btn.secondary} disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Suivant
        </button>
      </div>
    </div>
  )
}
