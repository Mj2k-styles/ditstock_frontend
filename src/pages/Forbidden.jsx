import { Link } from 'react-router-dom'

export default function Forbidden() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-xl font-semibold">Page inaccessible</h1>
      <p className="mt-2 text-muted">
        Cette page n&apos;existe pas ou votre rôle ne permet pas de la consulter.
      </p>
      <Link to="/" className="mt-4 inline-block text-brand underline">
        Retour au tableau de bord
      </Link>
    </div>
  )
}
