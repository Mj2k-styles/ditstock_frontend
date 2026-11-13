import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { Alert, Field } from '../components/ui'
import { errorMessage } from '../utils/format'
import { btn, inputClass } from '../utils/styles'

export const PASSWORD_MIN_LENGTH = 8

// Nouveau mot de passe à partir du lien reçu par e-mail (?token=...)
export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Les deux mots de passe ne sont pas identiques.')
      return
    }
    setSaving(true)
    try {
      const data = await resetPassword(token, password)
      setDone(data.message)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-xl font-semibold">Nouveau mot de passe</h1>
        {!token && <Alert>Lien incomplet : refaites une demande de réinitialisation.</Alert>}
        <Alert>{error}</Alert>
        <Alert tone="ok">{done}</Alert>
        {!done && (
          <>
            <Field label="Nouveau mot de passe" htmlFor="password" help={`${PASSWORD_MIN_LENGTH} caractères minimum.`}>
              <input
                id="password"
                type="password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Confirmer le mot de passe" htmlFor="confirm">
              <input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />
            </Field>
            <button type="submit" disabled={saving || !token} className={`${btn.primary} w-full`}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </>
        )}
        <p className="text-center text-sm">
          <Link to="/login" className={btn.link}>
            {done ? 'Se connecter' : 'Retour à la connexion'}
          </Link>
          {!done && (
            <>
              {' · '}
              <Link to="/mot-de-passe-oublie" className={btn.link}>
                Nouveau lien
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  )
}
