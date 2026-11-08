import { useState } from 'react'
import Modal from './Modal'
import { Alert, Field, Select } from './ui'
import { btn, inputClass } from '../utils/styles'
import { errorMessage } from '../utils/format'

// fields : [{ name, label, type?, required?, requiredOnNew?, options?, step?, help?, onlyNew?, omitIfEmpty? }]
// type : text | textarea | number | email | password | select | checkbox
export default function RecordForm({ title, fields, initial = {}, onSubmit, onClose }) {
  const isNew = !initial.id
  const visible = fields.filter((f) => !(f.onlyNew && !isNew))
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      visible.map((f) => [f.name, initial[f.name] ?? (f.type === 'checkbox' ? true : '')]),
    ),
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = {}
    for (const f of visible) {
      const v = values[f.name]
      if (f.omitIfEmpty && v === '') continue
      if (f.type === 'number') payload[f.name] = v === '' ? null : Number(v)
      else if (f.type === 'select') payload[f.name] = v === '' ? null : v
      // Champ optionnel laissé vide : on envoie null (le backend refuse "" pour un e-mail, par ex.)
      else if (v === '' && !(f.required || (f.requiredOnNew && isNew))) payload[f.name] = null
      else payload[f.name] = v
    }
    try {
      await onSubmit(payload)
      onClose()
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        {visible.map((f) => {
          const id = `f-${f.name}`
          const isRequired = f.required || (f.requiredOnNew && isNew)
          const common = { id, required: isRequired && f.type !== 'select' ? true : undefined }
          let control
          if (f.type === 'textarea') {
            control = (
              <textarea
                {...common}
                rows={3}
                value={values[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
                className={inputClass}
              />
            )
          } else if (f.type === 'select') {
            control = (
              <Select
                id={id}
                required={isRequired}
                value={values[f.name]}
                onChange={(v) => set(f.name, v)}
                options={f.options}
                placeholder="— Choisir —"
              />
            )
          } else if (f.type === 'checkbox') {
            return (
              <label key={f.name} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!values[f.name]}
                  onChange={(e) => set(f.name, e.target.checked)}
                />
                {f.label}
              </label>
            )
          } else {
            control = (
              <input
                {...common}
                type={f.type ?? 'text'}
                step={f.step}
                min={f.type === 'number' ? 0 : undefined}
                autoComplete={f.type === 'password' ? 'new-password' : undefined}
                value={values[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
                className={inputClass}
              />
            )
          }
          return (
            <Field key={f.name} label={f.label} htmlFor={id} help={f.help}>
              {control}
            </Field>
          )
        })}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btn.secondary} onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className={btn.primary} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
