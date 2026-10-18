import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Properties } from '../api/endpoints'
import { ErrorNote, Field, PageTitle, SuccessNote } from '../components/Ui'

const REASONS = [
  ['BROKER_POSING_AS_OWNER', 'Broker posing as owner'], ['FAKE', 'Fake or misleading listing'], ['DUPLICATE', 'Duplicate listing'],
  ['WRONG_PRICE', 'Wrong price'], ['ALREADY_SOLD', 'Already sold'], ['WRONG_LOCATION', 'Wrong location'], ['OTHER', 'Something else'],
]

export default function ReportListing() {
  const id = Number(useParams().id)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [state, setState] = useState<{ ok?: string; err?: unknown; busy?: boolean }>({})

  async function submit(e: FormEvent) {
    e.preventDefault()
    setState({ busy: true })
    try { setState({ ok: (await Properties.report(id, { reason, details: details || undefined })).message }) }
    catch (err) { setState({ err }) }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <PageTitle title="Report a listing" sub={`Listing #${id}. Reports are reviewed by our team; the owner does not see who reported.`} />
      {state.ok ? (
        <div className="space-y-4"><SuccessNote>{state.ok}</SuccessNote><Link to="/search" className="btn-ghost">Back to search</Link></div>
      ) : (
        <form onSubmit={submit} className="card space-y-4 p-6">
          <Field label="What's wrong?">
            <select className="input" required value={reason} onChange={e => setReason(e.target.value)}>
              <option value="">Choose a reason</option>
              {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Details (optional)"><textarea className="input min-h-28" maxLength={1000} value={details} onChange={e => setDetails(e.target.value)} /></Field>
          <ErrorNote error={state.err} />
          <button className="btn-primary" disabled={state.busy}>Send report</button>
        </form>
      )}
    </div>
  )
}
