import { Link } from 'react-router-dom'
import { Properties, Reference } from '../api/endpoints'
import { CardSkeleton, PropertyCard } from '../components/PropertyCard'
import { SearchBar } from '../components/SearchBar'
import { BRAND } from '../brand'
import { useAsync } from '../lib/useAsync'
import type { PropertyCard as Card } from '../api/types'

const CATEGORIES = [
  { title: 'Flats & apartments', to: '/search?type=APARTMENT', icon: 'M4 21V5l8-3 8 3v16M9 21v-4h6v4M8 8h2M14 8h2M8 12h2M14 12h2' },
  { title: 'Independent houses', to: '/search?type=INDEPENDENT_HOUSE', icon: 'M3 11 12 4l9 7M5 10v11h14V10M10 21v-6h4v6' },
  { title: 'Plots & land', to: '/search?category=LAND', icon: 'M3 18l5-9 5 6 3-4 5 7zM14 6v4M14 6l3 1-3 1' },
  { title: 'Shops & offices', to: '/search?category=COMMERCIAL', icon: 'M3 9h18l-2-5H5zM4 9v12h16V9M9 21v-6h6v6' },
]

export default function Home() {
  const localities = useAsync(() => Reference.localities(), [])
  const featured = useAsync(() => Properties.featured(), [])
  const recent = useAsync(() => Properties.recent(), [])
  const popular = (localities.data ?? []).filter(l => l.popular)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-800">
        <svg className="absolute inset-x-0 bottom-0 h-40 w-full text-brand-700/60" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden>
          {/* Stylised fort skyline, an original nod to Gwalior's hilltop silhouette */}
          <path fill="currentColor" d="M0 160V110h80l20-30h60l10-20h40v20h30l15-40h30l15 40h40v-30h20v-15h20v15h20v30h60l20-50h50l20 50h50V90h30V70h20v20h30v40h90l20-25h60l20 25h80V95h40v65z" />
        </svg>
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-14 sm:pt-20">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-saffron-400">
            Now live in {BRAND.city.name}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Buy your next home <span className="text-saffron-400">straight from its owner.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-100">
            No middlemen, no brokerage. Search verified-contact listings across Gwalior, message owners and book site visits in one place.
          </p>
          <div className="mt-8 max-w-4xl"><SearchBar localities={localities.data ?? []} /></div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/search" className="btn-accent">Buy property</Link>
            <Link to="/sell" className="btn border border-white/30 text-white hover:bg-white/10">Sell your property, free</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CATEGORIES.map(c => (
            <Link key={c.title} to={c.to} className="card flex items-center gap-3 p-4 transition hover:border-brand-200 hover:shadow-md">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={c.icon} /></svg>
              </span>
              <span className="font-semibold text-slate-800">{c.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <Section title="Featured properties" sub="Owners who chose to promote their listing. Always marked as sponsored." link="/search?featured=true">
        <Grid loading={featured.loading} items={featured.data} empty="No featured listings right now." />
      </Section>

      {/* Localities */}
      <section className="mx-auto mt-14 max-w-7xl px-4">
        <h2 className="text-2xl font-bold text-slate-900">Popular localities in Gwalior</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {popular.map(l => (
            <Link key={l.id} to={`/search?locality=${l.slug}`} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-500 hover:text-brand-700">
              {l.name}
            </Link>
          ))}
          {!localities.loading && popular.length === 0 && <span className="text-sm text-slate-500">Localities could not be loaded.</span>}
        </div>
      </section>

      {/* Recent */}
      <Section title="Recently added" sub="Fresh listings, approved by our moderation team." link="/search?sort=newest">
        <Grid loading={recent.loading} items={recent.data} empty="No listings yet. Be the first to post your property." />
      </Section>

      {/* Trust */}
      <section className="mx-auto mt-16 max-w-7xl px-4">
        <div className="grid gap-6 rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">How we keep it safe</h2>
            <p className="mt-2 text-slate-600">We tell you exactly what we have checked and what we haven't.</p>
            <Link to="/guidelines" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">Read our verification rules →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Every listing is reviewed', 'A person checks each new or edited listing before it goes live.'],
              ['Clear badges, honest labels', '"Contact verified" means we confirmed the phone number. It is not a legal title check.'],
              ['Phone numbers stay private', "An owner's number is shown only after you send an enquiry, which keeps scrapers out."],
              ['Report in one tap', 'Spot a broker posing as owner or a fake price? Report it and our team acts on it.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl bg-brand-50 p-4">
                <p className="font-semibold text-brand-800">{t}</p>
                <p className="mt-1 text-sm text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sell CTA */}
      <section className="mx-auto mt-16 max-w-7xl px-4">
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-saffron-500 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-brand-900">Selling in Gwalior?</h2>
            <p className="mt-1 text-brand-900/80">List for free, get enquiries from real buyers, and manage visits from your phone.</p>
          </div>
          <Link to="/sell" className="btn bg-brand-900 text-white hover:bg-brand-800">Post your property</Link>
        </div>
      </section>
    </div>
  )
}

function Section({ title, sub, link, children }: { title: string; sub: string; link: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto mt-14 max-w-7xl px-4">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{sub}</p>
        </div>
        <Link to={link} className="shrink-0 text-sm font-semibold text-brand-700 hover:underline">See all →</Link>
      </div>
      {children}
    </section>
  )
}

function Grid({ loading, items, empty }: { loading: boolean; items?: Card[]; empty: string }) {
  if (loading) return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}</div>
  if (!items?.length) return <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">{empty}</p>
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.slice(0, 8).map(p => <PropertyCard key={p.id} p={p} />)}</div>
}
