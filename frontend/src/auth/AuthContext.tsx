import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { tokenStore } from '../api/client'
import { Auth } from '../api/endpoints'
import type { AuthResponse, Role, User } from '../api/types'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (r: AuthResponse) => void
  signOut: () => void
  hasRole: (r: Role) => boolean
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => tokenStore.get() !== null)

  useEffect(() => {
    if (!tokenStore.get()) return
    Auth.me().then(setUser).catch(() => tokenStore.set(null)).finally(() => setLoading(false))
  }, [])

  const signIn = useCallback((r: AuthResponse) => {
    tokenStore.set(r.token)
    setUser(r.user)
  }, [])
  const signOut = useCallback(() => {
    tokenStore.set(null)
    setUser(null)
  }, [])
  const hasRole = useCallback((r: Role) => !!user?.roles.includes(r), [user])

  const value = useMemo(() => ({ user, loading, signIn, signOut, hasRole }), [user, loading, signIn, signOut, hasRole])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used inside AuthProvider')
  return c
}
