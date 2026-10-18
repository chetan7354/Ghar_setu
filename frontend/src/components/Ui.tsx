import type { ReactNode } from 'react'
import { ApiError } from '../api/client'

export function ErrorNote({ error }: { error?: unknown }) {
  if (!error) return null
  const msg = error instanceof ApiError || error instanceof Error ? error.message : 'Something went wrong'
  return <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</div>
}

export function SuccessNote({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{children}</div>
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export function StatusPill({ tone, children }: { tone: 'green' | 'amber' | 'red' | 'slate' | 'blue'; children: ReactNode }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700',
    slate: 'bg-slate-100 text-slate-600', blue: 'bg-sky-50 text-sky-700',
  }
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
    </div>
  )
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-slate-600">{sub}</p>}
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${value === t.id ? 'border-brand-700 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          {t.label}{t.count != null && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 text-xs">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

/** Like Field, but for groups of buttons: a <label> must not wrap several controls. */
export function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <span className="label">{label}</span>
      {children}
    </div>
  )
}
