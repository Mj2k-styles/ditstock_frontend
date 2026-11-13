import axios from 'axios'
import { tokenStorage } from '../auth/tokenStorage'

export const baseURL = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({ baseURL })

// Ajoute le jeton d'accès à chaque requête
client.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Une seule demande de refresh à la fois, même si plusieurs requêtes échouent
let refreshPromise = null

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh`, null, {
        headers: { Authorization: `Bearer ${tokenStorage.getRefresh()}` },
      })
      .then((res) => {
        tokenStorage.setAccess(res.data.access_token)
        return res.data.access_token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    // Appels publics d'authentification : pas de tentative de rafraîchissement du jeton
    const isAuthCall = /\/auth\/(login|refresh|forgot-password|reset-password)/.test(original?.url ?? '')

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !isAuthCall &&
      tokenStorage.getRefresh()
    ) {
      original._retry = true
      try {
        const token = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${token}`
        return client(original)
      } catch {
        tokenStorage.clear()
        window.dispatchEvent(new Event('auth:logout'))
      }
    }
    return Promise.reject(error)
  },
)

export default client
