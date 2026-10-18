import { Link, useSearchParams } from 'react-router-dom'
import { Enquiries, Properties, Visits } from '../api/endpoints'
import { useAuth } from '../auth/AuthContext'
import { PropertyCard } from '../components/PropertyCard'
import { Empty, ErrorNote, PageTitle, StatusPill, Tabs } from '../components/Ui'
import { VisitList } from '../components/VisitList'
import { relDate } from '../lib/format'
import { useAsync } from '../lib/useAsync'

type Tab = 'saved' | 'enquiries' | 'visits'

export default function BuyerDashboard() {
  const { user } = useAuth()
  const [sp, setSp] = useSearchParams()
  const tab = (sp.get('tab') as Tab) || 'saved'
  const favs = useAsync(() => Properties.favourites(), [])
  const enq = useAsync(() => Enquiries.sent(), [])
  const visits = useAsync(() => Visits.requested(), [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageTitle title={`Namaste, ${user?.fullName.split(' ')[0]}`} sub="Your saved homes, enquiries and site visits." />
      <Tabs<Tab> value={tab} onChange={t => setSp({ tab: t })} tabs={[
        { id: 'saved', label: 'Saved', count: favs.data?.totalItems },
        { id: 'enquiries', label: 'My enquiries', count: enq.data?.totalItems },
        { id: 'visits', label: 'Site visits', count: visits.data?.totalItems },
      ]} />
      {tab === 'saved' && (
        <>
          <ErrorNote error={favs.error} />
          {favs.data?.items.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{favs.data.items.map(p => <PropertyCard key={p.id} p={p} />)}</div>
          ) : !favs.loading && <Empty title="Nothing saved yet">Tap ♡ Save on any property to keep it here.</Empty>}
        </>
      )}
      {tab === 'enquiries' && (
        <div className="space-y-3">
          <ErrorNote error={enq.error} />
          {enq.data?.items.length ? enq.data.items.map(e => (
            <div key={e.id} className="card p-4">
              <div className="flex justify-between gap-2">
                <Link to={`/property/${e.propertyId}`} className="font-semibold hover:text-brand-700">{e.propertyTitle}</Link>
                <StatusPill tone={e.status === 'REPLIED' ? 'green' : 'slate'}>{e.status === 'REPLIED' ? 'Owner replied' : 'Sent'}</StatusPill>
              </div>
              <p className="mt-1 text-sm text-slate-600">You: {e.message}</p>
              {e.ownerReply && <p className="mt-2 rounded-lg bg-brand-50 p-2 text-sm text-brand-900">{e.counterpartName}: {e.ownerReply}</p>}
              <p className="mt-2 text-xs text-slate-400">{relDate(e.createdAt)}{e.counterpartPhone && ` · Owner: +91 ${e.counterpartPhone}`}</p>
            </div>
          )) : !enq.loading && <Empty title="No enquiries sent yet" />}
        </div>
      )}
      {tab === 'visits' && visits.data && <VisitList visits={visits.data.items} role="buyer" onChange={visits.reload} />}
    </div>
  )
}
