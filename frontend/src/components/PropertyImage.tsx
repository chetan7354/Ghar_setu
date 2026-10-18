import type { PropertyType } from '../api/types'
import { LAND_TYPES } from '../lib/format'

const COMMERCIAL: PropertyType[] = ['SHOP', 'OFFICE', 'WAREHOUSE', 'OTHER_COMMERCIAL']

/** Photo if the owner uploaded one, otherwise a branded illustration by property type. */
export function PropertyImage({ url, type, alt, className = '' }: { url?: string; type: PropertyType; alt: string; className?: string }) {
  if (url) return <img src={url} alt={alt} loading="lazy" className={`object-cover ${className}`} />
  const land = LAND_TYPES.includes(type)
  const shop = COMMERCIAL.includes(type)
  return (
    <div role="img" aria-label={alt} className={`relative overflow-hidden bg-gradient-to-br from-brand-100 via-brand-50 to-saffron-100 ${className}`}>
      <svg viewBox="0 0 200 120" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax slice" aria-hidden>
        <circle cx="160" cy="28" r="14" fill="#E8A33D" opacity=".55" />
        <path d="M0 98 Q50 86 100 96 T200 92 V120 H0Z" fill="#a9d3db" opacity=".6" />
        {land ? (
          <g stroke="#0F4C5C" strokeWidth="2" fill="none" opacity=".75">
            <path d="M40 104 L80 80 L150 84 L170 106 Z" strokeDasharray="5 4" />
            <path d="M120 82 v-16 M120 66 l10 4 -10 4" />
          </g>
        ) : shop ? (
          <g fill="#0F4C5C" opacity=".8">
            <rect x="62" y="48" width="76" height="56" rx="3" />
            <rect x="58" y="42" width="84" height="12" rx="2" fill="#E8A33D" />
            <rect x="72" y="64" width="24" height="40" fill="#d5eaee" />
            <rect x="104" y="64" width="24" height="20" fill="#d5eaee" />
          </g>
        ) : (
          <g opacity=".85">
            <path d="M60 104 V64 L100 38 L140 64 V104 Z" fill="#0F4C5C" />
            <path d="M52 68 L100 34 L148 68" stroke="#E8A33D" strokeWidth="6" fill="none" strokeLinejoin="round" />
            <rect x="90" y="78" width="20" height="26" fill="#E8A33D" />
            <rect x="70" y="70" width="14" height="12" fill="#d5eaee" />
            <rect x="116" y="70" width="14" height="12" fill="#d5eaee" />
          </g>
        )}
      </svg>
    </div>
  )
}
