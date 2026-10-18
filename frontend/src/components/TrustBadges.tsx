import type { Trust } from '../api/types'

/** Wording deliberately avoids "legally verified": these badges describe contact checks and document review only. */
export function TrustBadges({ trust, compact = false }: { trust: Trust; compact?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {trust.directOwner && (
        <span className="inline-flex items-center gap-1 rounded-full bg-saffron-100 px-2 py-0.5 text-xs font-semibold text-saffron-600">
          ● Direct owner
        </span>
      )}
      {trust.contactVerified && (
        <span title="Owner's phone number was confirmed by our team" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          ✓ Contact verified
        </span>
      )}
      {trust.ownershipDocumentsReviewed && !compact && (
        <span title="Owner shared ownership papers which our team looked at. This is not a legal title check." className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
          ✓ Documents reviewed
        </span>
      )}
    </div>
  )
}
