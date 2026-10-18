import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Enquiries, Properties, Visits } from '../api/endpoints'
import type { Enquiry, MyListing } from '../api/types'
import { PropertyImage } from '../components/PropertyImage'
import { Empty, ErrorNote, PageTitle, StatusPill, Tabs } from '../components/Ui'
import { VisitList } from '../components/VisitList'
import { formatPrice, relDate } from '../lib/format'
import { useAsync } from '../lib/useAsync'

type Tab = 'listings' | 'enquiries' | 'visits'

export default function SellerDashboard() {
  const [sp, setSp] = useSearchParams()
  const tab = (sp.get('tab') as Tab) || 'listings'
  const listings = useAsync(() => Properties.mine(), [])
  const enq = useAsync(() => Enquiries.received(), [])
  const visits = useAsync(() => Visits.received(), [])
  const pendingVisits = visits.data?.items.filter(v => v.status === 'REQUESTED').length

  const totals = (listings.data?.items ?? []).reduce((a, l) => ({
    views: a.views + l.viewCount, enquiries: a.enquiries + l.enquiryCount, visits: a.visits + l.visitRequestCount,
  }), { views: 0, enquiries: 0, visits: 0 })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="Seller dashboard" sub="Manage listings, reply to buyers and confirm site visits." />
        <Link to="/sell" className="btn-accent">+ Post another property</Link>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[['Listing views', totals.views], ['Enquiries', totals.enquiries], ['Visit requests', totals.visits]].map(([k, v]) => (
          <div key={k} className="card p-4"><p className="text-xs uppercase text-slate-500">{k}</p><p className="text-2xl font-bold text-brand-800">{v}</p></div>
        ))}
      </div>
      <Tabs<Tab> value={tab} onChange={t => setSp({ tab: t })} tabs={[
        { id: 'listings', label: 'My listings', count: listings.data?.totalItems },
        { id: 'enquiries', label: 'Enquiries', count: enq.data?.items.filter(e => e.status !== 'REPLIED').length },
        { id: 'visits', label: 'Visit requests', count: pendingVisits },
      ]} />
      {tab === 'listings' && (
        <div className="space-y-3">
          <ErrorNote error={listings.error} />
          {listings.data?.items.length ? listings.data.items.map(l => <ListingRow key={l.card.id} l={l} onChange={listings.reload} />)
            : !listings.loading && <Empty title="You haven't posted a property yet"><Link className="text-brand-700 underline" to="/sell">Post your first listing</Link></Empty>}
        </div>
      )}
      {tab === 'enquiries' && (
        <div className="space-y-3">
          {enq.data?.items.length ? enq.data.items.map(e => <EnquiryRow key={e.id} e={e} onChange={enq.reload} />)
            : !enq.loading && <Empty title="No enquiries yet">Enquiries from buyers will appear here.</Empty>}
        </div>
      )}
      {tab === 'visits' && visits.data && <VisitList visits={visits.data.items} role="owner" onChange={visits.reload} />}
    </div>
  )
}

function ListingRow({ l, onChange }: { l: MyListing; onChange: () => void }) {
  const [err, setErr] = useState<unknown>()
  const act = (fn: () => Promise<unknown>, confirmText?: string) => async () => {
    if (confirmText && !window.confirm(confirmText)) return
    setErr(undefined)
    try { await fn(); onChange() } catch (e) { setErr(e) }
  }
  const mod = l.moderationStatus
  return (
    <div className="card flex flex-col gap-4 p-4 sm:flex-row">
      <PropertyImage url={l.card.coverImageUrl} type={l.card.propertyType} alt={l.card.title} className="h-28 w-full shrink-0 rounded-xl sm:w-40" />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone={mod === 'APPROVED' ? 'green' : mod === 'REJECTED' ? 'red' : 'amber'}>
            {mod === 'APPROVED' ? 'Live' : mod === 'REJECTED' ? 'Needs changes' : 'In review'}
          </StatusPill>
          {l.status !== 'ACTIVE' && <StatusPill tone="slate">{l.status.toLowerCase()}</StatusPill>}
          {l.featuredUntil && new Date(l.featuredUntil) > new Date() && <StatusPill tone="blue">Featured until {new Date(l.featuredUntil).toLocaleDateString('en-IN')}</StatusPill>}
        </div>
        <Link to={`/property/${l.card.id}`} className="mt-1 block font-semibold text-slate-900 hover:text-brand-700">{l.card.title}</Link>
        <p className="text-sm text-slate-500">{formatPrice(l.card.price)} · {l.card.locality.name} · {l.viewCount} views · {l.enquiryCount} enquiries · {l.visitRequestCount} visit requests</p>
        {l.moderationNote && <p className="mt-1 text-sm text-red-700">Reviewer note: {l.moderationNote}</p>}
        <ErrorNote error={err} />
        <div className="mt-3 flex flex-wrap gap-2">
          {l.status !== 'SOLD' && <Link to={`/sell/${l.card.id}/edit`} className="btn-ghost">Edit</Link>}
          {l.status === 'ACTIVE' && <button className="btn-ghost" onClick={act(() => Properties.pause(l.card.id))}>Pause</button>}
          {l.status === 'PAUSED' && <button className="btn-ghost" onClick={act(() => Properties.activate(l.card.id))}>Reactivate</button>}
          {l.status !== 'SOLD' && <button className="btn-ghost" onClick={act(() => Properties.markSold(l.card.id), 'Mark this property as sold? Buyers will no longer be able to enquire.')}>Mark sold</button>}
          <button className="btn text-red-600 hover:bg-red-50" onClick={act(() => Properties.remove(l.card.id), 'Delete this listing permanently from your dashboard?')}>Delete</button>
        </div>
      </div>
    </div>
  )
}

function EnquiryRow({ e, onChange }: { e: Enquiry; onChange: () => void }) {
  const [reply, setReply] = useState('')
  const [err, setErr] = useState<unknown>()
  async function send() {
    setErr(undefined)
    try { await Enquiries.reply(e.id, reply); setReply(''); onChange() } catch (x) { setErr(x) }
  }
  return (
    <div className="card p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <p className="font-semibold">{e.counterpartName} <span className="font-normal text-slate-500">about</span> <Link className="text-brand-700" to={`/property/${e.propertyId}`}>{e.propertyTitle}</Link></p>
        <span className="text-xs text-slate-400">{relDate(e.createdAt)}</span>
      </div>
      <p className="mt-2 text-slate-700">{e.message}</p>
      <p className="mt-1 text-sm text-slate-500">{e.counterpartPhone ? <a className="font-semibold text-brand-700" href={`tel:+91${e.counterpartPhone}`}>Call +91 {e.counterpartPhone}</a> : 'Buyer chose not to share their number.'}</p>
      {e.ownerReply ? (
        <p className="mt-2 rounded-lg bg-brand-50 p-2 text-sm">Your reply: {e.ownerReply}</p>
      ) : (
        <div className="mt-3 flex gap-2">
          <input className="input" placeholder="Write a reply" value={reply} maxLength={1000} onChange={x => setReply(x.target.value)} />
          <button className="btn-primary" disabled={reply.trim().length < 2} onClick={send}>Reply</button>
        </div>
      )}
      <ErrorNote error={err} />
    </div>
  )
}
