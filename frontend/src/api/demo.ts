// Sample data used ONLY by the static UI preview build (VITE_DEMO=1). Never bundled into the real app's API path.
import { ApiError } from './client'
import type { Locality, Page, PropertyCard, PropertyDetail, PropertyType } from './types'

const LOCALITIES: Locality[] = [
  ['City Centre', 'city-centre', '474011', true], ['Thatipur', 'thatipur', '474011', true], ['DD Nagar', 'dd-nagar', '474005', true],
  ['Morar', 'morar', '474006', true], ['Lashkar', 'lashkar', '474009', true], ['Gola Ka Mandir', 'gola-ka-mandir', '474005', true],
  ['Shivpuri Link Road', 'shivpuri-link-road', '474011', true], ['Jhansi Road', 'jhansi-road', '474002', true],
  ['Phool Bagh', 'phool-bagh', '474002', false], ['Vinay Nagar', 'vinay-nagar', '474012', false],
].map(([name, slug, pinCode, popular], i) => ({ id: i + 1, name: name as string, slug: slug as string, pinCode: pinCode as string, popular: popular as boolean }))

const AMENITIES = [['PARKING', 'Car parking'], ['POWER_BACKUP', 'Power backup'], ['LIFT', 'Lift'], ['SECURITY', '24x7 security'],
  ['WATER_SUPPLY', '24x7 water supply'], ['BOREWELL', 'Borewell'], ['GARDEN', 'Garden / park'], ['GATED', 'Gated society'],
  ['VASTU', 'Vastu compliant'], ['CORNER', 'Corner property']].map(([code, label]) => ({ code, label }))

type Seed = [string, PropertyType, number, number | null, number | null, 'SQFT' | 'SQYD', number | null, number, boolean, boolean, number]
// title, type, price, builtUp, plot, unit, beds, localityIdx, featured, contactVerified, daysAgo
const SEEDS: Seed[] = [
  ['3 BHK independent house near Thatipur chauraha', 'INDEPENDENT_HOUSE', 6500000, 1800, 1200, 'SQFT', 3, 1, true, true, 2],
  ['2 BHK flat in gated society, City Centre', 'APARTMENT', 3800000, 1150, null, 'SQFT', 2, 0, true, true, 4],
  ['East-facing residential plot on Shivpuri Link Road', 'PLOT', 2400000, null, 200, 'SQYD', null, 6, false, true, 1],
  ['4 BHK duplex villa with garden, DD Nagar', 'VILLA', 14500000, 3200, 2400, 'SQFT', 4, 2, true, false, 6],
  ['Ground-floor shop on main road, Lashkar', 'SHOP', 5200000, 420, null, 'SQFT', null, 4, false, true, 3],
  ['Affordable 1 BHK flat near Morar cantonment', 'APARTMENT', 1850000, 620, null, 'SQFT', 1, 3, false, false, 0],
  ['3 BHK builder floor, Gola Ka Mandir', 'BUILDER_FLOOR', 5600000, 1500, null, 'SQFT', 3, 5, false, true, 8],
  ['Office space, 2nd floor, Phool Bagh', 'OFFICE', 4300000, 950, null, 'SQFT', null, 8, false, false, 10],
  ['Corner plot in new colony, Jhansi Road', 'PLOT', 3100000, null, 240, 'SQYD', null, 7, false, false, 5],
  ['2 BHK independent house, Vinay Nagar sector 3', 'INDEPENDENT_HOUSE', 4200000, 1250, 900, 'SQFT', 2, 9, false, true, 12],
]

const now = Date.now()
const DETAILS: PropertyDetail[] = SEEDS.map(([title, type, price, built, plot, unit, beds, li, featured, cv, days], i) => {
  const land = type === 'PLOT'
  const home = beds != null
  const loc = LOCALITIES[li]
  const iso = new Date(now - days * 86400000).toISOString()
  return {
    id: 101 + i, title, propertyType: type,
    category: land ? 'LAND' : type === 'SHOP' || type === 'OFFICE' ? 'COMMERCIAL' : 'RESIDENTIAL',
    listingType: 'SALE', price, priceNegotiable: i % 2 === 0, builtUpArea: built ?? undefined, plotArea: plot ?? undefined,
    areaUnit: unit, bedrooms: beds ?? undefined, bathrooms: home ? Math.max(1, beds! - (i % 2)) : land ? undefined : 1,
    furnishing: home ? (['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'] as const)[i % 3] : undefined,
    propertyAgeYears: land ? undefined : (i * 3) % 11, possession: i === 6 ? 'UNDER_CONSTRUCTION' : 'READY',
    description: land
      ? `${title}. Clear approach road, electricity line nearby and a growing neighbourhood. Ideal for building your own home. Registry papers available for inspection.`
      : `${title}. Well-ventilated rooms, good natural light and a peaceful lane. Schools, hospitals and the local market are within a short drive. Visit any evening after 5 pm.`,
    addressLine: `Near main market, ${loc.name}`, locality: { id: loc.id, name: loc.name, slug: loc.slug }, city: 'Gwalior',
    pinCode: loc.pinCode ?? '474001', images: [], amenities: AMENITIES.slice(i % 4, (i % 4) + 4).map(a => a.label),
    amenityCodes: AMENITIES.slice(i % 4, (i % 4) + 4).map(a => a.code),
    owner: { id: 900 + i, name: ['Ramesh S.', 'Anita G.', 'Vikram T.', 'Sunita J.', 'Mohit A.'][i % 5], contactPreference: 'BOTH', phoneHidden: true },
    featured, featuredUntil: featured ? new Date(now + 5 * 86400000).toISOString() : undefined,
    trust: { contactVerified: cv, ownershipDocumentsReviewed: i === 0, directOwner: true },
    status: 'ACTIVE', moderationStatus: 'APPROVED', isOwner: false, favourited: false, viewCount: 40 + i * 17,
    publishedAt: iso, createdAt: iso, updatedAt: iso,
  }
})

function card(d: PropertyDetail): PropertyCard {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { images, description, addressLine, amenities, amenityCodes, owner, ...rest } = d
  return { ...rest, coverImageUrl: undefined } as PropertyCard
}

function search(q: Record<string, unknown>): Page<PropertyCard> {
  let list = DETAILS.slice()
  const n = (k: string) => (q[k] != null ? Number(q[k]) : undefined)
  if (q.locality) list = list.filter(p => p.locality.slug === q.locality)
  if (q.category) list = list.filter(p => p.category === q.category)
  if (q.type) list = list.filter(p => p.propertyType === q.type)
  if (n('minPrice')) list = list.filter(p => p.price >= n('minPrice')!)
  if (n('maxPrice')) list = list.filter(p => p.price <= n('maxPrice')!)
  if (n('minBedrooms')) list = list.filter(p => (p.bedrooms ?? 0) >= n('minBedrooms')!)
  if (q.furnishing) list = list.filter(p => p.furnishing === q.furnishing)
  if (q.possession) list = list.filter(p => p.possession === q.possession)
  if (q.featured) list = list.filter(p => p.featured)
  if (q.verified) list = list.filter(p => p.trust.contactVerified)
  if (q.q) list = list.filter(p => (p.title + p.locality.name).toLowerCase().includes(String(q.q).toLowerCase()))
  const sort = q.sort ?? 'relevance'
  const t = (p: PropertyDetail) => new Date(p.publishedAt!).getTime()
  list.sort((a, b) => sort === 'price_asc' ? a.price - b.price : sort === 'price_desc' ? b.price - a.price
    : sort === 'newest' ? t(b) - t(a) : Number(b.featured) - Number(a.featured) || t(b) - t(a))
  const size = n('size') ?? 12
  const page = n('page') ?? 0
  return { items: list.slice(page * size, page * size + size).map(card), page, size, totalItems: list.length, totalPages: Math.ceil(list.length / size) }
}

export async function handle<T>(method: string, path: string, _body?: unknown, query: Record<string, unknown> = {}): Promise<T> {
  await new Promise(r => setTimeout(r, 150))
  const r = (v: unknown) => v as T
  if (method === 'GET') {
    if (path === '/cities/gwalior/localities') return r(LOCALITIES)
    if (path === '/amenities') return r(AMENITIES)
    if (path === '/promotion-packages') return r([{ id: 1, code: 'FEATURED_7', name: 'Featured - 7 days', durationDays: 7, price: 499, active: true }, { id: 2, code: 'FEATURED_30', name: 'Featured - 30 days', durationDays: 30, price: 1499, active: true }])
    if (path === '/properties') return r(search(query))
    if (path === '/properties/featured') return r(DETAILS.filter(p => p.featured).map(card))
    if (path === '/properties/recent') return r(search({ sort: 'newest', size: 8 }).items)
    const m = path.match(/^\/properties\/(\d+)$/)
    if (m) {
      const d = DETAILS.find(p => p.id === Number(m[1]))
      if (!d) throw new ApiError(404, 'Property not found')
      return r(d)
    }
  }
  throw new ApiError(503, 'This is a UI preview. Sign-in, posting and messaging work only in the full app connected to the backend.')
}
