import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Locality } from '../api/types'
import { qs } from '../api/client'

const BUDGETS = [
  { label: 'Any budget', max: '' }, { label: 'Up to ₹25 L', max: '2500000' }, { label: 'Up to ₹50 L', max: '5000000' },
  { label: 'Up to ₹75 L', max: '7500000' }, { label: 'Up to ₹1 Cr', max: '10000000' }, { label: 'Up to ₹2 Cr', max: '20000000' },
]

export function SearchBar({ localities }: { localities: Locality[] }) {
  const nav = useNavigate()
  const [locality, setLocality] = useState('')
  const [category, setCategory] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    nav('/search' + qs({ locality, category, maxPrice }))
  }

  return (
    <form onSubmit={submit} className="grid gap-2 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
      <div className="flex items-center gap-2 rounded-xl px-3 sm:border-r sm:border-slate-200">
        <svg className="h-5 w-5 shrink-0 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
        <select aria-label="Locality" value={locality} onChange={e => setLocality(e.target.value)} className="w-full bg-transparent py-3 text-sm outline-none">
          <option value="">All of Gwalior</option>
          {localities.map(l => <option key={l.id} value={l.slug}>{l.name}</option>)}
        </select>
      </div>
      <select aria-label="Property type" value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl bg-transparent px-3 py-3 text-sm outline-none sm:border-r sm:border-slate-200">
        <option value="">Homes, plots & shops</option>
        <option value="RESIDENTIAL">Flats & houses</option>
        <option value="LAND">Plots & land</option>
        <option value="COMMERCIAL">Shops & offices</option>
      </select>
      <select aria-label="Budget" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="rounded-xl bg-transparent px-3 py-3 text-sm outline-none">
        {BUDGETS.map(b => <option key={b.label} value={b.max}>{b.label}</option>)}
      </select>
      <button className="btn-primary rounded-xl px-6 py-3 text-base">Search</button>
    </form>
  )
}
