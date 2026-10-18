import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Role } from '../api/types'
import { useAuth } from './AuthContext'

/** UX guard only. The backend enforces every permission independently. */
export function RequireAuth({ role, children }: { role?: Role; children: ReactNode }) {
  const { user, loading, hasRole } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="p-10 text-center text-slate-500">Loading…</div>
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
  if (role && !hasRole(role)) {
    return (
      <div className="mx-auto max-w-lg p-10 text-center">
        <h1 className="text-xl font-bold">You don't have access to this page</h1>
        <p className="mt-2 text-slate-600">This area needs a {role.toLowerCase()} account.</p>
      </div>
    )
  }
  return <>{children}</>
}
