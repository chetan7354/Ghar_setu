import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { Enquiries, Properties, Visits } from '../api/endpoints'
import type { PropertyDetail as Detail } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { PropertyImage } from '../components/PropertyImage'
import { TrustBadges } from '../components/TrustBadges'
import { ErrorNote, StatusPill, SuccessNote } from '../components/Ui'
import { areaText, formatPrice, FURNISHING_LABEL, localInputToIso, relDate, TYPE_LABEL, UNIT_LABEL } from '../lib/format'
import { useAsync } from '../lib/useAsync'

export default function PropertyDetail() {
  const id = Number(useParams().id)
  const { data: p, error, loading, reload, setData } = useAsync(() => Properties.get(id), [id])
  const [img, setImg] = useState(0)

  if (loading && !p) return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500">Loading property…</div>
  if (!p) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">{error instanceof ApiError && error.status === 404 ? 'This listing is not available' : 'Could not load this property'}</h1>
        <p className="mt-2 text-slate-600">It may have been sold, paused by the owner, or is waiting for review.</p>
        <Link to="/search" className="btn-primary mt-6">Browse other properties</Link>
      </div>
    )
  }

  const specs: [string, string | undefined][] = [
    ['Type', TYPE_LABEL[p.propertyType]],
    ['Built-up area', p.builtUpArea ? `${Number(p.builtUpArea).toLocaleString('en-IN')} ${UNIT_LABEL[p.areaUnit]}` : undefined],
    ['Plot area', p.plotArea ? `${Number(p.plotArea).toLocaleString('en-IN')} ${UNIT_LABEL[p.areaUnit]}` : undefined],
    ['Bedrooms', p.bedrooms != null ? String(p.bedrooms) : undefined],
    ['Bathrooms', p.bathrooms != null ? String(p.bathrooms) : undefined],
    ['Furnishing', p.furnishing ? FURNISHING_LABEL[p.furnishing] : undefined],
    ['Property age', p.propertyAgeYears != null ? (p.propertyAgeYears === 0 ? 'New' : `${p.propertyAgeYears} years`) : undefined],
    ['Possession', p.possession === 'READY' ? 'Ready to move' : 'Under construction'],
    ['PIN code', p.pinCode],
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:pb-8">
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/search" className="hover:text-brand-700">Gwalior</Link> ›{' '}
        <Link to={`/search?locality=${p.locality.slug}`} className="hover:text-brand-700">{p.locality.name}</Link>
      </nav>

      {p.isOwner && <OwnerBanner p={p} />}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          {/* Gallery */}
          <div className="overflow-hidden rounded-2xl">
            <PropertyImage url={p.images[img]?.url} type={p.propertyType} alt={p.title} className="aspect-[16/10] w-full" />
          </div>
          {p.images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {p.images.map((im, i) => (
                <button key={im.id} onClick={() => setImg(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 ${i === img ? 'ring-brand-500' : 'ring-transparent'}`}>
                  <img src={im.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {p.featured && <StatusPill tone="amber">Featured · Sponsored</StatusPill>}
                {p.status === 'SOLD' && <StatusPill tone="red">Sold</StatusPill>}
                <TrustBadges trust={p.trust} />
              </div>
              <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{p.title}</h1>
              <p className="mt-1 text-slate-600">{p.addressLine}, {p.locality.name}, {p.city}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-brand-800">{formatPrice(p.price)}</p>
              <p className="text-sm text-slate-500">{p.priceNegotiable ? 'Negotiable' : 'Fixed price'}{areaText(p) && ` · ${areaText(p)}`}</p>
            </div>
          </div>

          <section className="card mt-6 p-5">
            <h2 className="font-bold text-slate-900">Property details</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {specs.filter(([, v]) => v).map(([k, v]) => (
                <div key={k}><dt className="text-xs uppercase tracking-wide text-slate-500">{k}</dt><dd className="font-semibold text-slate-800">{v}</dd></div>
              ))}
            </dl>
          </section>

          <section className="card mt-6 p-5">
            <h2 className="font-bold text-slate-900">About this property</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">{p.description}</p>
          </section>

          {p.amenities.length > 0 && (
            <section className="card mt-6 p-5">
              <h2 className="font-bold text-slate-900">Amenities</h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {p.amenities.map(a => <li key={a} className="flex items-center gap-2 text-sm text-slate-700"><span className="text-brand-500">✓</span>{a}</li>)}
              </ul>
            </section>
          )}

          {p.latitude != null && p.longitude != null && (
            <section className="card mt-6 p-5">
              <h2 className="font-bold text-slate-900">Location</h2>
              <a className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:underline" target="_blank" rel="noreferrer"
                href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=17/${p.latitude}/${p.longitude}`}>
                Open map location ↗
              </a>
            </section>
          )}

          <p className="mt-6 text-xs text-slate-500">
            Posted {relDate(p.publishedAt ?? p.createdAt)} · {p.viewCount} views ·{' '}
            <Link to={`/report/${p.id}`} className="font-semibold text-red-600 hover:underline">Report this listing</Link>
          </p>
        </div>

        {!p.isOwner && p.status !== 'SOLD' && <ContactPanel p={p} onFav={fav => setData({ ...p, favourited: fav })} onEnquired={reload} />}
      </div>
    </div>
  )
}

function OwnerBanner({ p }: { p: Detail }) {
  const tone = p.moderationStatus === 'APPROVED' ? 'green' : p.moderationStatus === 'REJECTED' ? 'red' : 'amber'
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm">
        <span className="font-semibold">This is your listing.</span>{' '}
        Review status: <StatusPill tone={tone}>{p.moderationStatus.toLowerCase()}</StatusPill>{' '}
        Listing: <StatusPill tone="slate">{p.status.toLowerCase()}</StatusPill>
        {p.moderationNote && <p className="mt-1 text-slate-600">Note from our team: {p.moderationNote}</p>}
      </div>
      <Link to={`/sell/${p.id}/edit`} className="btn-ghost">Edit listing</Link>
    </div>
  )
}

function ContactPanel({ p, onFav, onEnquired }: { p: Detail; onFav: (v: boolean) => void; onEnquired: () => void }) {
  const { user } = useAuth()
  const nav = useNavigate()
  const loginFirst = () => nav(`/login?next=/property/${p.id}`)

  const [message, setMessage] = useState(`Hi, I'm interested in "${p.title}". Is it still available?`)
  const [sharePhone, setSharePhone] = useState(true)
  const [enqState, setEnqState] = useState<{ busy?: boolean; ok?: boolean; err?: unknown }>({})

  const [visitAt, setVisitAt] = useState('')
  const [visitNote, setVisitNote] = useState('')
  const [visitState, setVisitState] = useState<{ busy?: boolean; ok?: boolean; err?: unknown }>({})

  async function enquire(e: FormEvent) {
    e.preventDefault()
    if (!user) return loginFirst()
    setEnqState({ busy: true })
    try {
      await Enquiries.create(p.id, { message, sharePhone })
      setEnqState({ ok: true })
      onEnquired()
    } catch (err) { setEnqState({ err }) }
  }

  async function bookVisit(e: FormEvent) {
    e.preventDefault()
    if (!user) return loginFirst()
    setVisitState({ busy: true })
    try {
      await Visits.request(p.id, { preferredAt: localInputToIso(visitAt), note: visitNote || undefined })
      setVisitState({ ok: true })
    } catch (err) { setVisitState({ err }) }
  }

  async function toggleFav() {
    if (!user) return loginFirst()
    if (p.favourited) await Properties.unfavourite(p.id); else await Properties.favourite(p.id)
    onFav(!p.favourited)
  }

  const minDate = new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 16)

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <div id="contact" className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Listed by owner</p>
            <p className="text-lg font-bold text-slate-900">{p.owner?.name}</p>
          </div>
          <button onClick={toggleFav} className="btn-ghost px-3" aria-label={p.favourited ? 'Remove from saved' : 'Save property'}>
            {p.favourited ? '♥ Saved' : '♡ Save'}
          </button>
        </div>
        {p.owner?.phone ? (
          <a href={`tel:+91${p.owner.phone}`} className="btn-accent mt-4 w-full">Call +91 {p.owner.phone}</a>
        ) : (
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            {p.owner?.contactPreference === 'CHAT' ? 'This owner prefers messages over calls.' : "The owner's number appears here after you send an enquiry."}
          </p>
        )}

        <form onSubmit={enquire} className="mt-4 space-y-3">
          <textarea className="input min-h-24" value={message} onChange={e => setMessage(e.target.value)} maxLength={1000} required minLength={10} />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={sharePhone} onChange={e => setSharePhone(e.target.checked)} /> Share my phone number with the owner
          </label>
          <ErrorNote error={enqState.err} />
          {enqState.ok && <SuccessNote>Enquiry sent. The owner will see it in their dashboard.</SuccessNote>}
          <button className="btn-primary w-full" disabled={enqState.busy}>{user ? 'Send enquiry' : 'Log in to contact owner'}</button>
        </form>
      </div>

      <form id="visit" onSubmit={bookVisit} className="card space-y-3 p-5">
        <h3 className="font-bold text-slate-900">Book a site visit</h3>
        <input type="datetime-local" className="input" required min={minDate} value={visitAt} onChange={e => setVisitAt(e.target.value)} />
        <input className="input" placeholder="Note for the owner (optional)" maxLength={500} value={visitNote} onChange={e => setVisitNote(e.target.value)} />
        <ErrorNote error={visitState.err} />
        {visitState.ok && <SuccessNote>Visit requested. Track it in <Link className="underline" to="/dashboard?tab=visits">your dashboard</Link>.</SuccessNote>}
        <button className="btn-ghost w-full" disabled={visitState.busy}>Request visit</button>
        <p className="text-xs text-slate-500">The owner can accept, decline or suggest another time.</p>
      </form>

      {/* Mobile sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-slate-200 bg-white p-3 lg:hidden">
        <a href="#contact" className="btn-primary flex-1">Contact owner</a>
        <a href="#visit" className="btn-accent flex-1">Book visit</a>
      </div>
    </aside>
  )
}
