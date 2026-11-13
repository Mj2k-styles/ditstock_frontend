import { useState } from 'react'
import { changePassword } from '../api/auth'
import { Alert, Field, PageHeader } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { ROLE_LABELS } from '../utils/constants'
import { errorMessage } from '../utils/format'
import { btn, inputClass } from '../utils/styles'
import { PASSWORD_MIN_LENGTH } from './ResetPassword'

const EMPTY = { current: '', next: '', confirm: '' }

// Mon compte : informations et changement du mot de passe
export default function Account() {
  const { user } = useAuth()
  const [values, setValues] = useState(EMPTY)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (values.next !== values.confirm) {
      setError('Les deux nouveaux mots de passe ne sont pas identiques.')
      return
    }
    setSaving(true)
    try {
      const data = await changePassword(values.current, values.next)
      setSuccess(data.message)
      setValues(EMPTY)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Mon compte" />
      <div className="grid max-w-3xl gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-4 text-sm">
          <h2 className="mb-3 font-semibold">Informations</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-muted">Nom</dt>
              <dd>{user.full_name}</dd>
            </div>
            <div>
              <dt className="text-muted">E-mail</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted">Rôle</dt>
              <dd>{ROLE_LABELS[user.role] ?? user.role}</dd>
            </div>
          </dl>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-line bg-white p-4">
          <h2 className="font-semibold">Changer de mot de passe</h2>
          <Alert>{error}</Alert>
          <Alert tone="ok">{success}</Alert>
          <Field label="Mot de passe actuel" htmlFor="current">
            <input id="current" type="password" required autoComplete="current-password"
              value={values.current} onChange={set('current')} className={inputClass} />
          </Field>
          <Field label="Nouveau mot de passe" htmlFor="next" help={`${PASSWORD_MIN_LENGTH} caractères minimum.`}>
            <input id="next" type="password" required minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password"
              value={values.next} onChange={set('next')} className={inputClass} />
          </Field>
          <Field label="Confirmer le nouveau mot de passe" htmlFor="confirm">
            <input id="confirm" type="password" required autoComplete="new-password"
              value={values.confirm} onChange={set('confirm')} className={inputClass} />
          </Field>
          <div className="flex justify-end">
            <button type="submit" className={btn.primary} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
