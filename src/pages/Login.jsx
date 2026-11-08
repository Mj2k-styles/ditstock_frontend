import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Alert, Field } from '../components/ui'
import { btn, inputClass } from '../utils/styles'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      const status = err.response?.status
      setError(
        status === 401
          ? 'E-mail ou mot de passe incorrect.'
          : status === 403
            ? 'Ce compte est désactivé. Contactez un administrateur.'
            : status === 400
              ? 'Veuillez renseigner votre e-mail et votre mot de passe.'
              : 'Impossible de joindre le serveur. Réessayez.',
      )
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-xl font-semibold">Connexion</h1>
        <Alert>{error}</Alert>
        <Field label="Adresse e-mail" htmlFor="email">
          <input
            id="email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Mot de passe" htmlFor="password">
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
        <button type="submit" disabled={loading} className={`${btn.primary} w-full`}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
