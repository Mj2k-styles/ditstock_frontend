import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// <ProtectedRoute />                    : il faut être connecté
// <ProtectedRoute roles={['admin']} />  : il faut en plus avoir un de ces rôles
export default function ProtectedRoute({ roles }) {
  const { user, hasRole } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !hasRole(...roles)) return <Navigate to="/acces-refuse" replace />
  return <Outlet />
}
