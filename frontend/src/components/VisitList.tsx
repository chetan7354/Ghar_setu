import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Visits } from '../api/endpoints'
import type { Visit } from '../api/types'
import { dateTime, localInputToIso, VISIT_LABEL } from '../lib/format'
import { Empty, ErrorNote, StatusPill } from './Ui'

const TONE: Record<Visit['status'], 'green' | 'amber' | 'red' | 'slate' | 'blue'> = {
  REQUESTED: 'amber', ACCEPTED: 'green', REJECTED: 'red', RESCHEDULE_PROPOSED: 'blue', CANCELLED: 'slate', COMPLETED: 'green',
}

export function VisitList({ visits, role, onChange }: { visits: Visit[]; role: 'owner' | 'buyer'; onChange: () => void }) {
  if (!visits.length) return <Empty title="No site visits yet" />
  return <div className="space-y-3">{visits.map(v => <VisitRow key={v.id} v={v} role={role} onChange={onChange} />)}</div>
}

function VisitRow({ v, role, onChange }: { v: Visit; role: 'owner' | 'buyer'; onChange: () => void }) {
  const [proposing, setProposing] = useState(false)
  const [at, setAt] = useState('')
  const [err, setErr] = useState<unknown>()
  const run = (fn: () => Promise<unknown>) => async () => {
    setErr(undefined)
    try { await fn(); onChange() } catch (e) { setErr(e) }
  }
  const open = v.status === 'REQUESTED' || v.status === 'RESCHEDULE_PROPOSED' || v.status === 'ACCEPTED'
  const past = new Date(v.scheduledAt).getTime() < Date.now()

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link to={`/property/${v.propertyId}`} className="font-semibold text-slate-900 hover:text-brand-700">{v.propertyTitle}</Link>
          <p className="text-sm text-slate-500">{v.locality} · {role === 'owner' ? 'Buyer' : 'Owner'}: {v.counterpartName}{v.counterpartPhone && ` · +91 ${v.counterpartPhone}`}</p>
        </div>
        <StatusPill tone={TONE[v.status]}>{VISIT_LABEL[v.status]}</StatusPill>
      </div>
      <p className="mt-2 text-sm">
        <span className="text-slate-500">{v.status === 'RESCHEDULE_PROPOSED' ? 'Owner proposed: ' : 'When: '}</span>
        <span className="font-semibold">{dateTime(v.scheduledAt)}</span>
        {v.status === 'RESCHEDULE_PROPOSED' && <span className="text-slate-500"> (buyer asked for {dateTime(v.preferredAt)})</span>}
      </p>
      {v.buyerNote && <p className="mt-1 text-sm text-slate-600">Buyer note: {v.buyerNote}</p>}
      {v.ownerNote && <p className="mt-1 text-sm text-slate-600">Owner note: {v.ownerNote}</p>}
      <ErrorNote error={err} />
      {open && (
        <div className="mt-3 flex flex-wrap gap-2">
          {role === 'owner' && v.status === 'REQUESTED' && <button className="btn-primary" onClick={run(() => Visits.accept(v.id))}>Accept</button>}
          {role === 'owner' && v.status !== 'ACCEPTED' && <button className="btn-ghost" onClick={run(() => Visits.reject(v.id))}>Decline</button>}
          {role === 'owner' && <button className="btn-ghost" onClick={() => setProposing(p => !p)}>Suggest another time</button>}
          {role === 'owner' && v.status === 'ACCEPTED' && past && <button className="btn-accent" onClick={run(() => Visits.complete(v.id))}>Mark visit done</button>}
          {role === 'buyer' && v.status === 'RESCHEDULE_PROPOSED' && <button className="btn-primary" onClick={run(() => Visits.acceptProposal(v.id))}>Accept new time</button>}
          {role === 'buyer' && <button className="btn-ghost" onClick={run(() => Visits.cancel(v.id))}>Cancel visit</button>}
        </div>
      )}
      {proposing && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input type="datetime-local" className="input w-auto" value={at} onChange={e => setAt(e.target.value)} />
          <button className="btn-primary" disabled={!at} onClick={run(async () => { await Visits.propose(v.id, localInputToIso(at)); setProposing(false) })}>Send proposal</button>
        </div>
      )}
    </div>
  )
}
