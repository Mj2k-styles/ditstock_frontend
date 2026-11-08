import { useEffect } from 'react'

export default function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`my-8 w-full rounded-lg bg-white shadow-lg ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="px-2 text-muted hover:text-ink">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
