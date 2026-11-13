import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { Alert, Field } from '../components/ui'
import { errorMessage } from '../utils/format'
import { btn, inputClass } from '../utils/styles'

// Demande d'un lien de réinitialisation (cahier des charges, F1.2)
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      const data = await forgotPassword(email)
      setMessage(data.message)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-xl font-semibold">Mot de passe oublié</h1>
        <p className="text-sm text-muted">
          Saisissez votre adresse e-mail : vous recevrez un lien pour choisir un nouveau mot de passe.
        </p>
        <Alert>{error}</Alert>
        <Alert tone="ok">{message}</Alert>
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
        <button type="submit" disabled={sending} className={`${btn.primary} w-full`}>
          {sending ? 'Envoi…' : 'Envoyer le lien'}
        </button>
        <p className="text-center text-sm">
          <Link to="/login" className={btn.link}>
            Retour à la connexion
          </Link>
        </p>
      </form>
    </div>
  )
}
