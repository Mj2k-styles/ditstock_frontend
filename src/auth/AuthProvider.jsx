import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext'
import { tokenStorage } from './tokenStorage'
import * as authApi from '../api/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser())

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    tokenStorage.set(data)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  // Session expirée : le client Axios émet cet événement si le refresh échoue
  useEffect(() => {
    window.addEventListener('auth:logout', logout)
    return () => window.removeEventListener('auth:logout', logout)
  }, [logout])

  const hasRole = useCallback(
    (...roles) => !!user && roles.includes(user.role),
    [user],
  )

  const value = useMemo(
    () => ({ user, login, logout, hasRole }),
    [user, login, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
