import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Logo } from './Logo'

export function Header() {
  const { user, signOut, hasRole } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'text-brand-700' : 'text-slate-600 hover:text-brand-700'}`
  const dashboard = hasRole('ADMIN') ? '/admin' : hasRole('SELLER') ? '/dashboard/seller' : '/dashboard'

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" onClick={() => setOpen(false)}><Logo /></Link>
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/search" className={link}>Buy</NavLink>
          <NavLink to="/sell" className={link}>Sell</NavLink>
          <NavLink to="/pricing" className={link}>Pricing</NavLink>
          <NavLink to="/guidelines" className={link}>Trust & safety</NavLink>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to={dashboard} className="btn-ghost">My {hasRole('ADMIN') ? 'admin' : 'dashboard'}</Link>
              <button className="text-sm text-slate-500 hover:text-slate-800" onClick={() => { signOut(); nav('/') }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/sell" className="btn-accent">Post property free</Link>
            </>
          )}
        </div>
        <button className="rounded-md p-2 md:hidden" aria-label="Menu" onClick={() => setOpen(o => !o)}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden" onClick={() => setOpen(false)}>
          <div className="flex flex-col gap-1">
            <NavLink to="/search" className={link}>Buy property</NavLink>
            <NavLink to="/sell" className={link}>Sell property</NavLink>
            <NavLink to="/pricing" className={link}>Pricing</NavLink>
            <NavLink to="/guidelines" className={link}>Trust & safety</NavLink>
            {user ? (
              <>
                <NavLink to={dashboard} className={link}>My dashboard</NavLink>
                <button className="px-3 py-2 text-left text-sm text-slate-600" onClick={() => { signOut(); nav('/') }}>Log out</button>
              </>
            ) : (
              <NavLink to="/login" className={link}>Log in / Register</NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
