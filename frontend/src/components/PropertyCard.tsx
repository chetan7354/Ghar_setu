import { Link } from 'react-router-dom'
import type { PropertyCard as Card } from '../api/types'
import { areaText, formatPrice, relDate, TYPE_LABEL } from '../lib/format'
import { PropertyImage } from './PropertyImage'
import { TrustBadges } from './TrustBadges'

export function PropertyCard({ p }: { p: Card }) {
  return (
    <Link to={`/property/${p.id}`} className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        <PropertyImage url={p.coverImageUrl} type={p.propertyType} alt={p.title} className="aspect-[4/3] w-full" />
        {p.featured && (
          <span className="absolute left-3 top-3 rounded-md bg-brand-900/85 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-saffron-400">
            Featured · Sponsored
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl font-bold text-brand-800">{formatPrice(p.price)}</span>
          {p.priceNegotiable && <span className="text-xs text-slate-500">Negotiable</span>}
        </div>
        <h3 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-700">{p.title}</h3>
        <p className="text-sm text-slate-500">{p.locality.name}, {p.city}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-700">
          {p.bedrooms != null && <span>{p.bedrooms} BHK</span>}
          {areaText(p) && <span>{areaText(p)}</span>}
          <span>{TYPE_LABEL[p.propertyType]}</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <TrustBadges trust={p.trust} compact />
          <span className="text-xs text-slate-400">{relDate(p.publishedAt)}</span>
        </div>
      </div>
    </Link>
  )
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="aspect-[4/3] bg-slate-200" />
      <div className="space-y-2 p-4">
        <div className="h-5 w-1/3 rounded bg-slate-200" />
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
      </div>
    </div>
  )
}
