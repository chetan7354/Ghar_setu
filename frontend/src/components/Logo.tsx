import { BRAND } from '../brand'

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="8" fill={light ? '#E8A33D' : '#0F4C5C'} />
        <path d="M6 18 16 9l10 9" fill="none" stroke={light ? '#0F4C5C' : '#E8A33D'} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 25v-6h12v6M6 25h20" fill="none" stroke={light ? '#0F4C5C' : '#fff'} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-brand-700'}`}>
        Ghar<span className="text-saffron-500">Setu</span>
      </span>
      <span className="sr-only">{BRAND.name}</span>
    </span>
  )
}
