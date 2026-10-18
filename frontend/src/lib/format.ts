import type { AreaUnit, Furnishing, PropertyType, VisitStatus } from '../api/types'

/** Indian-style price: ₹45 L, ₹1.2 Cr. */
export function formatPrice(v: number): string {
  if (v >= 1e7) return `₹${trim(v / 1e7)} Cr`
  if (v >= 1e5) return `₹${trim(v / 1e5)} L`
  return `₹${v.toLocaleString('en-IN')}`
}
function trim(n: number) {
  return n.toFixed(2).replace(/\.?0+$/, '')
}

export const TYPE_LABEL: Record<PropertyType, string> = {
  APARTMENT: 'Flat / Apartment', INDEPENDENT_HOUSE: 'Independent house', VILLA: 'Villa',
  BUILDER_FLOOR: 'Builder floor', PLOT: 'Residential plot', AGRICULTURAL_LAND: 'Agricultural land',
  SHOP: 'Shop / Showroom', OFFICE: 'Office space', WAREHOUSE: 'Warehouse', OTHER_COMMERCIAL: 'Other commercial',
}
export const LAND_TYPES: PropertyType[] = ['PLOT', 'AGRICULTURAL_LAND']
export const HOME_TYPES: PropertyType[] = ['APARTMENT', 'INDEPENDENT_HOUSE', 'VILLA', 'BUILDER_FLOOR']

export const UNIT_LABEL: Record<AreaUnit, string> = { SQFT: 'sq ft', SQYD: 'sq yd', SQM: 'sq m' }
export const FURNISHING_LABEL: Record<Furnishing, string> = {
  UNFURNISHED: 'Unfurnished', SEMI_FURNISHED: 'Semi-furnished', FULLY_FURNISHED: 'Fully furnished',
}
export const VISIT_LABEL: Record<VisitStatus, string> = {
  REQUESTED: 'Waiting for owner', ACCEPTED: 'Confirmed', REJECTED: 'Declined',
  RESCHEDULE_PROPOSED: 'New time proposed', CANCELLED: 'Cancelled', COMPLETED: 'Visited',
}

export function areaText(p: { builtUpArea?: number; plotArea?: number; areaUnit: AreaUnit }): string {
  const a = p.builtUpArea ?? p.plotArea
  return a ? `${Number(a).toLocaleString('en-IN')} ${UNIT_LABEL[p.areaUnit]}` : ''
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}
export function relDate(iso?: string): string {
  if (!iso) return ''
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' })
}

/** Value for <input type="datetime-local"> -> ISO instant. */
export function localInputToIso(v: string): string {
  return new Date(v).toISOString()
}
