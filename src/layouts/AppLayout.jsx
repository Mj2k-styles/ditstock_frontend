import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { alerts } from '../api/resources'
import { ROLES, ROLE_LABELS } from '../utils/constants'

const { ADMIN, GESTIONNAIRE, MAGASINIER } = ROLES
const ALL = [ADMIN, GESTIONNAIRE, MAGASINIER]
const MANAGERS = [ADMIN, GESTIONNAIRE]

const MENU = [
  { to: '/', label: 'Tableau de bord', roles: ALL, end: true },
  { to: '/produits', label: 'Produits', roles: ALL },
  { to: '/mouvements', label: 'Mouvements', roles: ALL },
  { to: '/alertes', label: 'Alertes', roles: ALL, badge: true },
  { to: '/entrepots', label: 'Entrepôts', roles: ALL },
  { to: '/categories', label: 'Catégories', roles: MANAGERS },
  { to: '/fournisseurs', label: 'Fournisseurs', roles: MANAGERS },
  { to: '/rapports', label: 'Rapports', roles: MANAGERS },
  { to: '/utilisateurs', label: 'Utilisateurs', roles: [ADMIN] },
  { to: '/audit', label: "Journal d'audit", roles: [ADMIN] },
]

function useAlertCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let active = true
    const load = () =>
      alerts
        .list({ per_page: 1 })
        .then((p) => active && setCount(p.total))
        .catch(() => {})
    load()
    const timer = setInterval(load, 60000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])
  return count
}

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth()
  const [open, setOpen] = useState(false)
  const alertCount = useAlertCount()
  const links = MENU.filter((item) => hasRole(...item.roles))

  return (
    <div className="min-h-screen md:flex">
      <header className="flex items-center justify-between bg-ink px-4 py-3 text-white md:hidden">
        <span className="font-semibold">Gestion de stock</span>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          className="rounded px-2 py-1 hover:bg-white/10"
        >
          ☰
        </button>
      </header>

      <aside
        className={`${open ? 'block' : 'hidden'} w-full bg-ink text-white/80 md:block md:min-h-screen md:w-60 md:shrink-0`}
      >
        <div className="hidden px-5 py-5 text-lg font-semibold text-white md:block">
          Gestion de stock
        </div>
        <nav aria-label="Navigation principale" className="flex flex-col gap-1 px-3 pb-3">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between rounded px-3 py-2 text-sm ${isActive ? 'bg-brand text-white' : 'hover:bg-white/10'}`
              }
            >
              {item.label}
              {item.badge && alertCount > 0 && (
                <span
                  aria-label={`${alertCount} alertes`}
                  className="rounded-full bg-warn px-2 text-xs font-semibold text-white"
                >
                  {alertCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-end gap-4 border-b border-line bg-white px-6 py-3 text-sm">
          <Link to="/mon-compte" className="text-muted hover:text-ink hover:underline" title="Mon compte">
            {user.full_name} · {ROLE_LABELS[user.role] ?? user.role}
          </Link>
          <button onClick={logout} className="rounded border border-line px-3 py-1 hover:bg-surface">
            Déconnexion
          </button>
        </div>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
