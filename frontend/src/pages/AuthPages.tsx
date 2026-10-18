import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, IS_DEMO } from '../api/client'
import { Auth } from '../api/endpoints'
import { useAuth } from '../auth/AuthContext'
import { Logo } from '../components/Logo'
import { ErrorNote, Field } from '../components/Ui'

function safeNext(next: string | null, fallback: string) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}

export function Login() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<unknown>()
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(undefined)
    try {
      const r = await Auth.login({ email, password })
      signIn(r)
      const home = r.user.roles.includes('ADMIN') ? '/admin' : r.user.roles.includes('SELLER') ? '/dashboard/seller' : '/dashboard'
      nav(safeNext(sp.get('next'), home), { replace: true })
    } catch (e) { setErr(e) } finally { setBusy(false) }
  }

  return (
    <AuthShell title="Welcome back" sub="Log in to contact owners and manage your listings.">
      {IS_DEMO && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Preview logins (password demo1234)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[['Buyer', 'buyer@demo.in'], ['Seller', 'seller@demo.in'], ['Admin', 'admin@demo.in']].map(([label, mail]) => (
              <button key={mail} type="button" className="rounded-lg border border-amber-300 bg-white px-3 py-1 font-medium hover:bg-amber-100"
                onClick={() => { setEmail(mail); setPassword('demo1234') }}>{label}</button>
            ))}
          </div>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input className="input" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className="input" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></Field>
        <ErrorNote error={err} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="text-center text-sm text-slate-600">New here? <Link className="font-semibold text-brand-700" to={`/register${sp.get('next') ? `?next=${encodeURIComponent(sp.get('next')!)}` : ''}`}>Create an account</Link></p>
      </form>
    </AuthShell>
  )
}

export function Register() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [f, setF] = useState({ fullName: '', email: '', phone: '', password: '', accountType: (sp.get('type') === 'SELLER' ? 'SELLER' : 'BUYER') as 'BUYER' | 'SELLER' })
  const [agree, setAgree] = useState(false)
  const [err, setErr] = useState<unknown>()
  const [fe, setFe] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErr(undefined); setFe({})
    try {
      const r = await Auth.register(f)
      signIn(r)
      nav(safeNext(sp.get('next'), f.accountType === 'SELLER' ? '/sell' : '/search'), { replace: true })
    } catch (e) {
      setErr(e)
      if (e instanceof ApiError) setFe(e.fieldErrors)
    } finally { setBusy(false) }
  }

  return (
    <AuthShell title="Create your free account" sub="One account to buy and sell. No brokerage, ever.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(['BUYER', 'SELLER'] as const).map(t => (
            <button type="button" key={t} onClick={() => setF({ ...f, accountType: t })}
              className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${f.accountType === t ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-slate-300'}`}>
              {t === 'BUYER' ? 'I want to buy' : 'I want to sell'}
            </button>
          ))}
        </div>
        <Field label="Full name" error={fe.fullName}><input className="input" autoComplete="name" required value={f.fullName} onChange={e => setF({ ...f, fullName: e.target.value })} /></Field>
        <Field label="Email" error={fe.email}><input className="input" type="email" autoComplete="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Mobile number" error={fe.phone} hint="10 digits, without +91">
          <input className="input" inputMode="numeric" maxLength={10} autoComplete="tel-national" required value={f.phone} onChange={e => setF({ ...f, phone: e.target.value.replace(/\D/g, '') })} />
        </Field>
        <Field label="Password" error={fe.password} hint="At least 8 characters">
          <input className="input" type="password" autoComplete="new-password" required minLength={8} value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
        </Field>
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input type="checkbox" className="mt-1" checked={agree} onChange={e => setAgree(e.target.checked)} />
          <span>I agree to the <Link to="/terms" className="text-brand-700 underline">Terms</Link> and <Link to="/privacy" className="text-brand-700 underline">Privacy Policy</Link>.</span>
        </label>
        <ErrorNote error={err} />
        <button className="btn-primary w-full" disabled={busy || !agree}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="text-center text-sm text-slate-600">Already registered? <Link className="font-semibold text-brand-700" to="/login">Log in</Link></p>
      </form>
    </AuthShell>
  )
}

function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6 text-center"><Logo /></div>
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-slate-600">{sub}</p>
        {children}
      </div>
    </div>
  )
}
