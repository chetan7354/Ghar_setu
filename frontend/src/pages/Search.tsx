import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Properties, Reference } from '../api/endpoints'
import type { SearchParams, SortOrder } from '../api/types'
import { CardSkeleton, PropertyCard } from '../components/PropertyCard'
import { Empty, ErrorNote } from '../components/Ui'
import { TYPE_LABEL } from '../lib/format'
import { useAsync } from '../lib/useAsync'

const KEYS = ['locality', 'category', 'type', 'minPrice', 'maxPrice', 'minBedrooms', 'minArea', 'maxArea',
  'furnishing', 'possession', 'featured', 'verified', 'q', 'sort', 'page'] as const

function readParams(sp: URLSearchParams): SearchParams {
  const o: Record<string, unknown> = { city: 'gwalior', size: 12 }
  KEYS.forEach(k => {
    const v = sp.get(k)
    if (v == null || v === '') return
    if (['minPrice', 'maxPrice', 'minBedrooms', 'minArea', 'maxArea', 'page'].includes(k)) o[k] = Number(v)
    else if (k === 'featured' || k === 'verified') o[k] = v === 'true'
    else o[k] = v
  })
  return o as SearchParams
}

export default function Search() {
  const [sp, setSp] = useSearchParams()
  const params = readParams(sp)
  const key = sp.toString()
  const result = useAsync(() => Properties.search(params), [key])
  const localities = useAsync(() => Reference.localities(), [])
  const [showFilters, setShowFilters] = useState(false)

  function set(k: string, v: string | undefined) {
    const next = new URLSearchParams(sp)
    if (v) next.set(k, v); else next.delete(k)
    if (k !== 'page') next.delete('page')
    setSp(next)
  }

  const page = result.data
  const filters = (
    <div className="space-y-5" key={key}>
      <Filter label="Locality">
        <select className="input" value={sp.get('locality') ?? ''} onChange={e => set('locality', e.target.value)}>
          <option value="">All localities</option>
          {localities.data?.map(l => <option key={l.id} value={l.slug}>{l.name}</option>)}
        </select>
      </Filter>
      <Filter label="Property type">
        <select className="input" value={sp.get('type') ?? ''} onChange={e => set('type', e.target.value)}>
          <option value="">Any type</option>
          {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Filter>
      <Filter label="Budget (₹)">
        <div className="grid grid-cols-2 gap-2">
          <input className="input" inputMode="numeric" placeholder="Min" defaultValue={sp.get('minPrice') ?? ''}
            onBlur={e => set('minPrice', e.target.value.replace(/\D/g, ''))} />
          <input className="input" inputMode="numeric" placeholder="Max" defaultValue={sp.get('maxPrice') ?? ''}
            onBlur={e => set('maxPrice', e.target.value.replace(/\D/g, ''))} />
        </div>
      </Filter>
      <Filter label="Bedrooms">
        <div className="flex flex-wrap gap-2">
          {['1', '2', '3', '4'].map(b => (
            <button key={b} onClick={() => set('minBedrooms', sp.get('minBedrooms') === b ? undefined : b)}
              className={`rounded-full border px-3 py-1.5 text-sm ${sp.get('minBedrooms') === b ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white'}`}>
              {b}+ BHK
            </button>
          ))}
        </div>
      </Filter>
      <Filter label="Area (sq ft)">
        <div className="grid grid-cols-2 gap-2">
          <input className="input" inputMode="numeric" placeholder="Min" defaultValue={sp.get('minArea') ?? ''}
            onBlur={e => set('minArea', e.target.value.replace(/\D/g, ''))} />
          <input className="input" inputMode="numeric" placeholder="Max" defaultValue={sp.get('maxArea') ?? ''}
            onBlur={e => set('maxArea', e.target.value.replace(/\D/g, ''))} />
        </div>
      </Filter>
      <Filter label="Furnishing">
        <select className="input" value={sp.get('furnishing') ?? ''} onChange={e => set('furnishing', e.target.value)}>
          <option value="">Any</option>
          <option value="UNFURNISHED">Unfurnished</option>
          <option value="SEMI_FURNISHED">Semi-furnished</option>
          <option value="FULLY_FURNISHED">Fully furnished</option>
        </select>
      </Filter>
      <Filter label="Possession">
        <select className="input" value={sp.get('possession') ?? ''} onChange={e => set('possession', e.target.value)}>
          <option value="">Any</option>
          <option value="READY">Ready to move</option>
          <option value="UNDER_CONSTRUCTION">Under construction</option>
        </select>
      </Filter>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={sp.get('verified') === 'true'} onChange={e => set('verified', e.target.checked ? 'true' : undefined)} />
        Contact-verified owners only
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={sp.get('featured') === 'true'} onChange={e => set('featured', e.target.checked ? 'true' : undefined)} />
        Featured only
      </label>
      <button className="text-sm font-semibold text-brand-700 hover:underline" onClick={() => setSp(new URLSearchParams())}>Clear all filters</button>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties for sale in Gwalior</h1>
          <p className="text-sm text-slate-500">{page ? `${page.totalItems.toLocaleString('en-IN')} ${page.totalItems === 1 ? 'listing' : 'listings'} found` : 'Searching…'}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <form className="min-w-0 basis-full sm:basis-64" onSubmit={e => { e.preventDefault(); set('q', (new FormData(e.currentTarget).get('q') as string).trim()) }}>
            <input name="q" className="input" placeholder="Search title or locality" defaultValue={sp.get('q') ?? ''} maxLength={100} />
          </form>
          <select aria-label="Sort" className="input w-auto" value={sp.get('sort') ?? 'relevance'} onChange={e => set('sort', e.target.value as SortOrder)}>
            <option value="relevance">Featured first</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
          <button className="btn-ghost lg:hidden" onClick={() => setShowFilters(true)}>Filters</button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block"><div className="card sticky top-20 p-5">{filters}</div></aside>
        <div>
          <ErrorNote error={result.error} />
          {result.loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}</div>
          ) : page && page.items.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{page.items.map(p => <PropertyCard key={p.id} p={p} />)}</div>
              {page.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button className="btn-ghost" disabled={page.page === 0} onClick={() => set('page', String(page.page - 1))}>← Previous</button>
                  <span className="text-sm text-slate-600">Page {page.page + 1} of {page.totalPages}</span>
                  <button className="btn-ghost" disabled={page.page + 1 >= page.totalPages} onClick={() => set('page', String(page.page + 1))}>Next →</button>
                </div>
              )}
            </>
          ) : !result.error && (
            <Empty title="No properties match these filters">Try widening your budget or choosing another locality.</Empty>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <button className="btn-primary" onClick={() => setShowFilters(false)}>Show results</button>
            </div>
            {filters}
          </div>
        </div>
      )}
    </div>
  )
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="label">{label}</p>{children}</div>
}
