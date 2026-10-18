import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Admin } from '../api/endpoints'
import type { ModerationItem, PromotionPackage } from '../api/types'
import { Empty, ErrorNote, PageTitle, StatusPill, Tabs } from '../components/Ui'
import { dateTime, formatPrice, TYPE_LABEL } from '../lib/format'
import { useAsync } from '../lib/useAsync'

type Tab = 'moderation' | 'reports' | 'users' | 'audit'

export default function AdminDashboard() {
  const [sp, setSp] = useSearchParams()
  const tab = (sp.get('tab') as Tab) || 'moderation'
  const stats = useAsync(() => Admin.stats(), [])
  const pending = useAsync(() => Admin.pending(), [])
  const reports = useAsync(() => Admin.reports(), [])
  const packages = useAsync(() => Admin.packages(), [])
  const [q, setQ] = useState('')
  const users = useAsync(() => Admin.users(q), [q])
  const audit = useAsync(() => (tab === 'audit' ? Admin.audit() : Promise.resolve(undefined)), [tab])
  const [err, setErr] = useState<unknown>()
  const run = (fn: () => Promise<unknown>, after: () => void) => async () => {
    setErr(undefined)
    try { await fn(); after(); stats.reload() } catch (e) { setErr(e) }
  }

  const s = stats.data
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageTitle title="Admin" sub="Moderation, reports, users and platform numbers." />
      {s && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {([['Users', s.totalUsers], ['Live listings', s.activeListings], ['Pending review', s.pendingModeration],
              ['Enquiries', s.totalEnquiries], ['Visits requested', s.visitsRequested], ['Visits completed', s.visitsCompleted],
              ['Open reports', s.openReports], ['Featured (manual)', s.manualFeaturedPromotions]] as const).map(([k, v]) => (
              <div key={k} className="card p-3"><p className="text-[11px] uppercase text-slate-500">{k}</p><p className="text-xl font-bold text-brand-800">{v}</p></div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{s.revenueNote} Completed sales are not tracked; visit counts are not transactions.</p>
        </>
      )}
      <ListingTools packages={packages.data ?? []} />
      <div className="mt-6"><ErrorNote error={err} /></div>
      <Tabs<Tab> value={tab} onChange={t => setSp({ tab: t })} tabs={[
        { id: 'moderation', label: 'Moderation', count: pending.data?.totalItems },
        { id: 'reports', label: 'Reports', count: reports.data?.totalItems },
        { id: 'users', label: 'Users' }, { id: 'audit', label: 'Audit log' },
      ]} />

      {tab === 'moderation' && (
        <div className="space-y-3">
          {pending.data?.items.length ? pending.data.items.map(m => (
            <ModerationRow key={m.id} m={m}
              onApprove={run(() => Admin.approve(m.id), pending.reload)}
              onReject={note => run(() => Admin.reject(m.id, note), pending.reload)()} />
          )) : !pending.loading && <Empty title="Moderation queue is empty" />}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.data?.items.length ? reports.data.items.map(r => (
            <div key={r.id} className="card p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <Link to={`/property/${r.propertyId}`} className="font-semibold hover:text-brand-700">{r.propertyTitle}</Link>
                <StatusPill tone="red">{r.reason.replaceAll('_', ' ').toLowerCase()}</StatusPill>
              </div>
              {r.details && <p className="mt-1 text-sm text-slate-600">{r.details}</p>}
              <p className="text-xs text-slate-400">{dateTime(r.createdAt)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-primary" onClick={run(() => Admin.resolveReport(r.id, 'ACTION_TAKEN', true), reports.reload)}>Pause listing & close</button>
                <button className="btn-ghost" onClick={run(() => Admin.resolveReport(r.id, 'DISMISSED', false), reports.reload)}>Dismiss</button>
              </div>
            </div>
          )) : !reports.loading && <Empty title="No open reports" />}
        </div>
      )}

      {tab === 'users' && (
        <div>
          <input className="input mb-4 max-w-sm" placeholder="Search name, email or phone" value={q} onChange={e => setQ(e.target.value)} />
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Roles</th><th className="p-3">Status</th><th /></tr></thead>
              <tbody>
                {users.data?.items.map(u => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="p-3 font-medium">{u.fullName}</td><td className="p-3">{u.email}</td><td className="p-3">{u.phone}</td>
                    <td className="p-3">{u.roles.join(', ').toLowerCase()}</td>
                    <td className="p-3"><StatusPill tone={u.status === 'ACTIVE' ? 'green' : 'red'}>{u.status.toLowerCase()}</StatusPill></td>
                    <td className="p-3 text-right">
                      {!u.roles.includes('ADMIN') && (u.status === 'ACTIVE'
                        ? <button className="text-red-600 hover:underline" onClick={run(() => Admin.suspend(u.id), users.reload)}>Suspend</button>
                        : <button className="text-brand-700 hover:underline" onClick={run(() => Admin.reinstate(u.id), users.reload)}>Reinstate</button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">When</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">Entity</th><th className="p-3">Details</th></tr></thead>
            <tbody>
              {audit.data?.items.map(a => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="whitespace-nowrap p-3">{dateTime(a.createdAt)}</td><td className="p-3">#{a.actorId ?? 'anon'}</td>
                  <td className="p-3 font-mono text-xs">{a.action}</td><td className="p-3">{a.entityType} #{a.entityId}</td><td className="p-3 text-slate-600">{a.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ModerationRow({ m, onApprove, onReject }: {
  m: ModerationItem; onApprove: () => void; onReject: (note: string) => void
}) {
  const [note, setNote] = useState('')
  return (
    <div className="card p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <Link to={`/property/${m.id}`} className="font-semibold hover:text-brand-700">{m.title}</Link>
          <p className="text-sm text-slate-500">{TYPE_LABEL[m.propertyType]} · {m.locality} · {formatPrice(m.price)} · {m.imageCount} photos</p>
          <p className="text-sm text-slate-500">Owner: {m.ownerName} ({m.ownerEmail}) · submitted {dateTime(m.createdAt)}</p>
        </div>
        {m.possibleDuplicateOf && <Link to={`/property/${m.possibleDuplicateOf}`}><StatusPill tone="red">Possible duplicate of #{m.possibleDuplicateOf}</StatusPill></Link>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn-primary" onClick={onApprove}>Approve</button>
        <input className="input max-w-xs" placeholder="Reason (needed to reject)" value={note} onChange={e => setNote(e.target.value)} />
        <button className="btn-ghost" disabled={!note.trim()} onClick={() => onReject(note)}>Reject</button>
      </div>
    </div>
  )
}

/** Phase 1 monetisation: admin features a listing by hand (for example after an offline payment). */
function ListingTools({ packages }: { packages: PromotionPackage[] }) {
  const [id, setId] = useState('')
  const [pkg, setPkg] = useState('')
  const [msg, setMsg] = useState<string>()
  const [err, setErr] = useState<unknown>()
  const run = (fn: () => Promise<string>) => async () => {
    setErr(undefined); setMsg(undefined)
    try { setMsg(await fn()) } catch (e) { setErr(e) }
  }
  return (
    <div className="card mt-6 flex flex-wrap items-end gap-3 p-4">
      <div><span className="label">Listing ID</span><input className="input w-32" inputMode="numeric" value={id} onChange={e => setId(e.target.value.replace(/\D/g, ''))} /></div>
      <div><span className="label">Package</span>
        <select className="input" value={pkg} onChange={e => setPkg(e.target.value)}>
          <option value="">Choose</option>
          {packages.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
        </select>
      </div>
      <button className="btn-primary" disabled={!id || !pkg}
        onClick={run(async () => `Featured until ${dateTime((await Admin.feature(Number(id), Number(pkg))).featuredUntil)}`)}>Feature listing</button>
      <button className="btn-ghost" disabled={!id} onClick={run(async () => { await Admin.contactVerified(Number(id), true); return 'Marked contact verified' })}>Mark contact verified</button>
      {msg && <span className="text-sm text-emerald-700">{msg}</span>}
      <ErrorNote error={err} />
    </div>
  )
}
