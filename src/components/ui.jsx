import { inputClass } from '../utils/styles'

export function PageHeader({ title, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function Alert({ children, tone = 'danger' }) {
  if (!children) return null
  const tones = {
    danger: 'bg-danger-soft text-danger',
    warn: 'bg-warn-soft text-warn',
    ok: 'bg-brand-soft text-brand-dark',
  }
  return (
    <p role="alert" className={`mb-4 rounded px-3 py-2 text-sm ${tones[tone]}`}>
      {children}
    </p>
  )
}

export function Badge({ tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-surface text-muted',
    ok: 'bg-brand-soft text-brand-dark',
    warn: 'bg-warn-soft text-warn',
    danger: 'bg-danger-soft text-danger',
  }
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Spinner({ label = 'Chargement…' }) {
  return <p className="py-6 text-center text-sm text-muted">{label}</p>
}

export function Field({ label, htmlFor, help, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
    </div>
  )
}

export function Select({ id, value, onChange, options, placeholder, ...rest }) {
  return (
    <select
      id={id}
      value={value ?? ''}
      onChange={(e) => {
        const opt = options.find((o) => String(o.value) === e.target.value)
        onChange(opt ? opt.value : '')
      }}
      className={inputClass}
      {...rest}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
