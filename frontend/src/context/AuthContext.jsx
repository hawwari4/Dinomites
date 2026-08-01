import { createContext, useCallback, useState } from 'react'
import { authApi } from '../api/endpoints'

export const AuthContext = createContext(null)

const USER_KEY = 'qstp.user'
const TOKEN_KEY = 'qstp.token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  })

  const persistSession = useCallback((token, profile) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(profile))
    setUser(profile)
    return profile
  }, [])

  const login = useCallback(async (role) => {
    const { token, user: profile } = await authApi.login(role)
    return persistSession(token, profile)
  }, [persistSession])

  const loginIntern = useCallback(async (email, password) => {
    const { token, user: profile } = await authApi.loginIntern(email, password)
    return persistSession(token, profile)
  }, [persistSession])

  const loginRole = useCallback(async (role, username, password) => {
    const { token, user: profile } = await authApi.loginRole(role, username, password)
    return persistSession(token, profile)
  }, [persistSession])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, loginIntern, loginRole, persistSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
