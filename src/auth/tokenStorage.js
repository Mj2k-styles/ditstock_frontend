const ACCESS = 'access_token'
const REFRESH = 'refresh_token'
const USER = 'user'

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS),
  getRefresh: () => localStorage.getItem(REFRESH),
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER))
    } catch {
      return null
    }
  },
  set({ access_token, refresh_token, user }) {
    localStorage.setItem(ACCESS, access_token)
    localStorage.setItem(REFRESH, refresh_token)
    localStorage.setItem(USER, JSON.stringify(user))
  },
  setAccess: (token) => localStorage.setItem(ACCESS, token),
  clear() {
    localStorage.removeItem(ACCESS)
    localStorage.removeItem(REFRESH)
    localStorage.removeItem(USER)
  },
}
