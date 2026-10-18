// In-browser stand-in for the backend, used ONLY by the static preview build (VITE_DEMO=1).
// It mimics the real API's rules closely enough to click through every page; data lives in memory
// and resets on reload. The real app always talks to the Spring Boot API instead.
import { ApiError, tokenStore } from './client'
import type {
  AuditItem, Enquiry, Locality, Page, PropertyCard, PropertyDetail, PropertyRequest, PropertyType, Role, User, Visit,
} from './types'

// ---------- seed data ----------

const LOCALITIES: Locality[] = [
  ['City Centre', 'city-centre', '474011', true], ['Thatipur', 'thatipur', '474011', true], ['DD Nagar', 'dd-nagar', '474005', true],
  ['Morar', 'morar', '474006', true], ['Lashkar', 'lashkar', '474009', true], ['Gola Ka Mandir', 'gola-ka-mandir', '474005', true],
  ['Shivpuri Link Road', 'shivpuri-link-road', '474011', true], ['Jhansi Road', 'jhansi-road', '474002', true],
  ['Phool Bagh', 'phool-bagh', '474002', false], ['Vinay Nagar', 'vinay-nagar', '474012', false],
].map(([name, slug, pinCode, popular], i) => ({ id: i + 1, name: name as string, slug: slug as string, pinCode: pinCode as string, popular: popular as boolean }))

const AMENITIES = [['PARKING', 'Car parking'], ['POWER_BACKUP', 'Power backup'], ['LIFT', 'Lift'], ['SECURITY', '24x7 security'],
  ['WATER_SUPPLY', '24x7 water supply'], ['BOREWELL', 'Borewell'], ['GARDEN', 'Garden / park'], ['GATED', 'Gated society'],
  ['VASTU', 'Vastu compliant'], ['CORNER', 'Corner property']].map(([code, label]) => ({ code, label }))

const PACKAGES = [
  { id: 1, code: 'FEATURED_7', name: 'Featured - 7 days', durationDays: 7, price: 499, active: true },
  { id: 2, code: 'FEATURED_30', name: 'Featured - 30 days', durationDays: 30, price: 1499, active: true },
]

interface DemoUser extends User { password: string; status: 'ACTIVE' | 'SUSPENDED'; createdAt: string }

const now = Date.now()
const iso = (msAgo: number) => new Date(now - msAgo).toISOString()
const DAY = 86400000

const users: DemoUser[] = [
  { id: 1, fullName: 'Demo Admin', email: 'admin@demo.in', phone: '9000000001', roles: ['ADMIN'], password: 'demo1234', status: 'ACTIVE', createdAt: iso(30 * DAY), emailVerified: false, phoneVerified: false },
  { id: 2, fullName: 'Ramesh Singh', email: 'seller@demo.in', phone: '9826012345', roles: ['BUYER', 'SELLER'], password: 'demo1234', status: 'ACTIVE', createdAt: iso(20 * DAY), emailVerified: false, phoneVerified: false },
  { id: 3, fullName: 'Priya Sharma', email: 'buyer@demo.in', phone: '9893067890', roles: ['BUYER'], password: 'demo1234', status: 'ACTIVE', createdAt: iso(10 * DAY), emailVerified: false, phoneVerified: false },
]

interface DemoProperty extends PropertyDetail { ownerId: number; possibleDuplicateOf?: number }

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
const OWNER_NAMES = ['Anita Gupta', 'Vikram Tomar', 'Sunita Jain', 'Mohit Agrawal']
OWNER_NAMES.forEach((n, i) => users.push({
  id: 10 + i, fullName: n, email: `owner${i + 1}@demo.in`, phone: `98260${String(10000 + i * 1111).slice(0, 5)}`,
  roles: ['BUYER', 'SELLER'], password: 'demo1234', status: 'ACTIVE', createdAt: iso(25 * DAY), emailVerified: false, phoneVerified: false,
}))

const CATEGORY = (t: PropertyType) =>
  ['PLOT', 'AGRICULTURAL_LAND'].includes(t) ? 'LAND' as const : ['SHOP', 'OFFICE', 'WAREHOUSE', 'OTHER_COMMERCIAL'].includes(t) ? 'COMMERCIAL' as const : 'RESIDENTIAL' as const

const properties: DemoProperty[] = SEEDS.map(([title, type, price, built, plot, unit, beds, li, featured, cv, days], i) => {
  const land = CATEGORY(type) === 'LAND'
  const home = beds != null
  const loc = LOCALITIES[li]
  const at = iso(days * DAY + 3600000)
  const ownerId = i % 3 === 0 ? 2 : 10 + (i % 4)
  const amen = AMENITIES.slice(i % 4, (i % 4) + 4)
  return {
    id: 101 + i, ownerId, title, propertyType: type, category: CATEGORY(type), listingType: 'SALE', price,
    priceNegotiable: i % 2 === 0, builtUpArea: built ?? undefined, plotArea: plot ?? undefined, areaUnit: unit,
    bedrooms: beds ?? undefined, bathrooms: home ? Math.max(1, beds! - (i % 2)) : land ? undefined : 1,
    furnishing: home ? (['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'] as const)[i % 3] : undefined,
    propertyAgeYears: land ? undefined : (i * 3) % 11, possession: i === 6 ? 'UNDER_CONSTRUCTION' : 'READY',
    description: land
      ? `${title}. Clear approach road, electricity line nearby and a growing neighbourhood. Ideal for building your own home. Registry papers available for inspection.`
      : `${title}. Well-ventilated rooms, good natural light and a peaceful lane. Schools, hospitals and the local market are within a short drive. Visit any evening after 5 pm.`,
    addressLine: `Near main market, ${loc.name}`, locality: { id: loc.id, name: loc.name, slug: loc.slug }, city: 'Gwalior',
    pinCode: loc.pinCode ?? '474001', images: [], amenities: amen.map(a => a.label), amenityCodes: amen.map(a => a.code),
    featured, featuredUntil: featured ? new Date(now + 5 * DAY).toISOString() : undefined,
    trust: { contactVerified: cv, ownershipDocumentsReviewed: i === 0, directOwner: true },
    status: 'ACTIVE', moderationStatus: 'APPROVED', isOwner: false, favourited: false, viewCount: 40 + i * 17,
    publishedAt: at, createdAt: at, updatedAt: at, contactPreference: 'BOTH',
  }
})
// One listing waiting for review, so the admin queue has something in it.
properties.push({
  ...properties[1], id: 120, ownerId: 2, title: '2 BHK flat near Gola Ka Mandir, just listed', price: 3200000,
  locality: { id: 6, name: 'Gola Ka Mandir', slug: 'gola-ka-mandir' }, featured: false, featuredUntil: undefined,
  trust: { contactVerified: false, ownershipDocumentsReviewed: false, directOwner: true },
  moderationStatus: 'PENDING', publishedAt: undefined, createdAt: iso(3600000), updatedAt: iso(3600000), viewCount: 0,
})

const favourites = new Set<string>(['3:102'])
const enquiries: (Enquiry & { buyerId: number; ownerId: number; sharePhone: boolean })[] = [
  { id: 1, propertyId: 101, propertyTitle: properties[0].title, buyerId: 3, ownerId: 2, sharePhone: true, counterpartName: '',
    message: 'Namaste, is the price negotiable? I can visit this Sunday.', status: 'NEW', createdAt: iso(5 * 3600000), updatedAt: iso(5 * 3600000) },
]
const visits: (Visit & { buyerId: number; ownerId: number })[] = [
  { id: 1, propertyId: 101, propertyTitle: properties[0].title, locality: 'Thatipur', buyerId: 3, ownerId: 2, counterpartName: '',
    preferredAt: new Date(now + 2 * DAY).toISOString(), scheduledAt: '', status: 'REQUESTED', buyerNote: 'Evening after 5 pm works best',
    createdAt: iso(4 * 3600000), updatedAt: iso(4 * 3600000) },
]
const reports: { id: number; propertyId: number; reason: string; details?: string; status: string; createdAt: string }[] = [
  { id: 1, propertyId: 108, reason: 'BROKER_POSING_AS_OWNER', details: 'Caller asked for 1% brokerage.', status: 'OPEN', createdAt: iso(DAY) },
]
const audit: AuditItem[] = []
let seq = 1000
const nextId = () => ++seq

// ---------- helpers ----------

function currentUser(): DemoUser | undefined {
  const t = tokenStore.get()
  const id = t?.startsWith('demo:') ? Number(t.slice(5)) : NaN
  return users.find(u => u.id === id && u.status === 'ACTIVE')
}
function requireUser(role?: Role): DemoUser {
  const u = currentUser()
  if (!u) throw new ApiError(401, 'Please log in')
  if (role && !u.roles.includes(role)) throw new ApiError(403, 'You are not allowed to perform this action')
  return u
}
const publicUser = (u: DemoUser): User => ({ id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, roles: [...u.roles], emailVerified: false, phoneVerified: false })
const auth = (u: DemoUser) => ({ token: `demo:${u.id}`, user: publicUser(u) })
const log = (actorId: number | undefined, action: string, entityType: string, entityId: number, details?: string) =>
  audit.unshift({ id: nextId(), actorId, action, entityType, entityId, details, createdAt: new Date().toISOString() })
const visible = (p: DemoProperty) => p.status === 'ACTIVE' && p.moderationStatus === 'APPROVED'
const isFeatured = (p: DemoProperty) => !!p.featuredUntil && new Date(p.featuredUntil).getTime() > Date.now()
const findProp = (id: number) => {
  const p = properties.find(x => x.id === id && x.status !== 'DELETED')
  if (!p) throw new ApiError(404, 'Property not found')
  return p
}
const owned = (id: number, u: DemoUser) => {
  const p = findProp(id)
  if (p.ownerId !== u.id) throw new ApiError(403, 'You are not allowed to perform this action')
  return p
}
const page = <T,>(items: T[], pageNo = 0, size = 20): Page<T> =>
  ({ items: items.slice(pageNo * size, pageNo * size + size), page: pageNo, size, totalItems: items.length, totalPages: Math.max(1, Math.ceil(items.length / size)) })
const firstName = (n: string) => { const p = n.split(' '); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0] }
const userById = (id: number) => users.find(u => u.id === id)!

function card(p: DemoProperty): PropertyCard {
  return {
    id: p.id, title: p.title, propertyType: p.propertyType, category: p.category, price: p.price, priceNegotiable: p.priceNegotiable,
    builtUpArea: p.builtUpArea, plotArea: p.plotArea, areaUnit: p.areaUnit, bedrooms: p.bedrooms, bathrooms: p.bathrooms,
    furnishing: p.furnishing, possession: p.possession, locality: p.locality, city: p.city, coverImageUrl: p.images[0]?.url,
    featured: isFeatured(p), trust: p.trust, publishedAt: p.publishedAt,
  }
}

function detail(p: DemoProperty): PropertyDetail {
  const u = currentUser()
  const isOwner = u?.id === p.ownerId
  const isAdmin = !!u?.roles.includes('ADMIN')
  if (!visible(p) && p.status !== 'SOLD' && !isOwner && !isAdmin) throw new ApiError(404, 'Property not found')
  if (!isOwner && visible(p)) p.viewCount++
  const enquired = !!u && enquiries.some(e => e.buyerId === u.id && e.propertyId === p.id)
  const owner = userById(p.ownerId)
  const pref = p.contactPreference ?? 'BOTH'
  const reveal = pref !== 'CHAT' && (isOwner || isAdmin || enquired)
  return {
    ...p, featured: isFeatured(p), isOwner, favourited: !!u && favourites.has(`${u.id}:${p.id}`),
    moderationNote: isOwner ? p.moderationNote : undefined,
    owner: { id: owner.id, name: firstName(owner.fullName), contactPreference: pref, phone: reveal ? owner.phone : undefined, phoneHidden: !reveal },
  }
}

function search(q: Record<string, unknown>): Page<PropertyCard> {
  const n = (k: string) => (q[k] != null && q[k] !== '' ? Number(q[k]) : undefined)
  if (n('minPrice') && n('maxPrice') && n('minPrice')! > n('maxPrice')!) throw new ApiError(400, 'Minimum price cannot be more than maximum price')
  const sqft = (p: DemoProperty) => (p.builtUpArea ?? p.plotArea ?? 0) * (p.areaUnit === 'SQYD' ? 9 : p.areaUnit === 'SQM' ? 10.7639 : 1)
  let list = properties.filter(visible)
  if (q.locality) list = list.filter(p => p.locality.slug === q.locality)
  if (q.category) list = list.filter(p => p.category === q.category)
  if (q.type) list = list.filter(p => p.propertyType === q.type)
  if (n('minPrice')) list = list.filter(p => p.price >= n('minPrice')!)
  if (n('maxPrice')) list = list.filter(p => p.price <= n('maxPrice')!)
  if (n('minBedrooms')) list = list.filter(p => (p.bedrooms ?? 0) >= n('minBedrooms')!)
  if (n('minArea')) list = list.filter(p => sqft(p) >= n('minArea')!)
  if (n('maxArea')) list = list.filter(p => sqft(p) <= n('maxArea')!)
  if (q.furnishing) list = list.filter(p => p.furnishing === q.furnishing)
  if (q.possession) list = list.filter(p => p.possession === q.possession)
  if (q.featured) list = list.filter(isFeatured)
  if (q.verified) list = list.filter(p => p.trust.contactVerified)
  if (q.q) list = list.filter(p => (p.title + p.locality.name).toLowerCase().includes(String(q.q).toLowerCase()))
  const t = (p: DemoProperty) => new Date(p.publishedAt ?? p.createdAt).getTime()
  const sort = q.sort ?? 'relevance'
  list.sort((a, b) => sort === 'price_asc' ? a.price - b.price : sort === 'price_desc' ? b.price - a.price
    : sort === 'newest' ? t(b) - t(a) : Number(isFeatured(b)) - Number(isFeatured(a)) || t(b) - t(a))
  return page(list.map(card), n('page') ?? 0, n('size') ?? 12)
}

function applyRequest(p: Partial<DemoProperty>, r: PropertyRequest) {
  if (!r.title || r.title.trim().length < 10) throw new ApiError(400, 'Some fields are invalid', { title: 'must be 10 to 150 characters' })
  if (!r.price || r.price < 10000) throw new ApiError(400, 'Some fields are invalid', { price: 'must be at least 10,000' })
  if (!r.localityId) throw new ApiError(400, 'Some fields are invalid', { localityId: 'must not be null' })
  if (!/^[1-9]\d{5}$/.test(r.pinCode)) throw new ApiError(400, 'Some fields are invalid', { pinCode: 'must be a 6-digit PIN code' })
  if (!r.description || r.description.trim().length < 30) throw new ApiError(400, 'Some fields are invalid', { description: 'must be 30 to 5000 characters' })
  const cat = CATEGORY(r.propertyType)
  if (cat === 'LAND' && !r.plotArea) throw new ApiError(400, 'Plot area is required for land')
  if (cat !== 'LAND' && !r.builtUpArea) throw new ApiError(400, 'Built-up area is required')
  const loc = LOCALITIES.find(l => l.id === r.localityId)!
  const amen = AMENITIES.filter(a => r.amenityCodes.includes(a.code))
  Object.assign(p, {
    title: r.title.trim(), propertyType: r.propertyType, category: cat, price: r.price, priceNegotiable: r.priceNegotiable,
    builtUpArea: r.builtUpArea ?? undefined, plotArea: r.plotArea ?? undefined, areaUnit: r.areaUnit,
    bedrooms: r.bedrooms ?? undefined, bathrooms: r.bathrooms ?? undefined, furnishing: r.furnishing ?? undefined,
    propertyAgeYears: r.propertyAgeYears ?? undefined, possession: r.possession, description: r.description.trim(),
    addressLine: r.addressLine.trim(), locality: { id: loc.id, name: loc.name, slug: loc.slug }, pinCode: r.pinCode,
    latitude: r.latitude ?? undefined, longitude: r.longitude ?? undefined, contactPreference: r.contactPreference,
    amenities: amen.map(a => a.label), amenityCodes: amen.map(a => a.code),
    moderationStatus: 'PENDING', moderationNote: undefined, updatedAt: new Date().toISOString(),
  })
}

function enquiryView(e: typeof enquiries[number], forOwner: boolean): Enquiry {
  const other = userById(forOwner ? e.buyerId : e.ownerId)
  const phone = forOwner ? (e.sharePhone ? other.phone : undefined) : other.phone
  return { id: e.id, propertyId: e.propertyId, propertyTitle: e.propertyTitle, counterpartName: other.fullName, counterpartPhone: phone,
    message: e.message, ownerReply: e.ownerReply, status: e.status, createdAt: e.createdAt, updatedAt: e.updatedAt }
}

function visitView(v: typeof visits[number], forOwner: boolean): Visit {
  const other = userById(forOwner ? v.buyerId : v.ownerId)
  const share = v.status === 'ACCEPTED' || v.status === 'COMPLETED'
  const scheduledAt = v.status === 'RESCHEDULE_PROPOSED' || (v.status === 'ACCEPTED' && v.proposedAt) ? v.proposedAt! : v.preferredAt
  return { ...v, counterpartName: other.fullName, counterpartPhone: share ? other.phone : undefined, scheduledAt }
}

function visitTransition(id: number, u: DemoUser, as: 'owner' | 'buyer', from: Visit['status'][], apply: (v: typeof visits[number]) => void, action: string) {
  const v = visits.find(x => x.id === id)
  if (!v) throw new ApiError(404, 'Visit request not found')
  if ((as === 'owner' ? v.ownerId : v.buyerId) !== u.id) throw new ApiError(403, 'You are not allowed to perform this action')
  if (!from.includes(v.status)) throw new ApiError(409, `This visit request is already ${v.status.toLowerCase().replace('_', ' ')}`)
  apply(v)
  v.updatedAt = new Date().toISOString()
  log(u.id, action, 'SITE_VISIT', v.id, `status=${v.status}`)
  return visitView(v, as === 'owner')
}

function reasonableTime(isoTime: string) {
  const t = new Date(isoTime).getTime()
  if (!(t > Date.now() + 3600000 && t < Date.now() + 90 * DAY)) throw new ApiError(400, 'Choose a time between 1 hour and 90 days from now')
}

function readFile(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = () => rej(new ApiError(400, 'Could not read this file'))
    r.readAsDataURL(f)
  })
}

// ---------- router ----------

type Body = Record<string, unknown> | undefined

export async function handle<T>(method: string, path: string, rawBody?: unknown, query: Record<string, unknown> = {}): Promise<T> {
  await new Promise(r => setTimeout(r, 120))
  const body = rawBody as Body
  const r = (v: unknown) => v as T
  const m = (re: RegExp) => path.match(re)
  let x: RegExpMatchArray | null

  // auth
  if (method === 'POST' && path === '/auth/login') {
    const u = users.find(u => u.email === String(body?.email).toLowerCase().trim() && u.password === body?.password)
    if (!u) throw new ApiError(401, 'Invalid email or password')
    if (u.status !== 'ACTIVE') throw new ApiError(403, 'This account is suspended. Contact support.')
    return r(auth(u))
  }
  if (method === 'POST' && path === '/auth/register') {
    const b = body as Record<string, string>
    const fe: Record<string, string> = {}
    if (!b.fullName || b.fullName.trim().length < 2) fe.fullName = 'must be 2 to 120 characters'
    if (!/^\S+@\S+\.\S+$/.test(b.email ?? '')) fe.email = 'must be a well-formed email address'
    if (!/^[6-9]\d{9}$/.test(b.phone ?? '')) fe.phone = 'must be a 10-digit Indian mobile number'
    if (!b.password || b.password.length < 8) fe.password = 'must be 8 to 72 characters'
    if (Object.keys(fe).length) throw new ApiError(400, 'Some fields are invalid', fe)
    if (users.some(u => u.email === b.email.toLowerCase())) throw new ApiError(409, 'An account with this email already exists')
    if (users.some(u => u.phone === b.phone)) throw new ApiError(409, 'An account with this phone number already exists')
    const u: DemoUser = { id: nextId(), fullName: b.fullName.trim(), email: b.email.toLowerCase(), phone: b.phone, password: b.password,
      roles: b.accountType === 'SELLER' ? ['BUYER', 'SELLER'] : ['BUYER'], status: 'ACTIVE', createdAt: new Date().toISOString(),
      emailVerified: false, phoneVerified: false }
    users.push(u)
    log(u.id, 'USER_REGISTERED', 'USER', u.id, `accountType=${b.accountType}`)
    return r(auth(u))
  }
  if (method === 'GET' && path === '/me') return r(publicUser(requireUser()))
  if (method === 'POST' && path === '/me/become-seller') {
    const u = requireUser()
    if (!u.roles.includes('SELLER')) u.roles.push('SELLER')
    return r(auth(u))
  }

  // reference
  if (method === 'GET' && path === '/cities/gwalior/localities') return r(LOCALITIES)
  if (method === 'GET' && path === '/amenities') return r(AMENITIES)
  if (method === 'GET' && path === '/promotion-packages') return r(PACKAGES.filter(p => p.active))

  // properties
  if (method === 'GET' && path === '/properties') return r(search(query))
  if (method === 'GET' && path === '/properties/featured') return r(search({ featured: true, sort: 'newest' }).items)
  if (method === 'GET' && path === '/properties/recent') return r(search({ sort: 'newest', size: 8 }).items)
  if (method === 'GET' && (x = m(/^\/properties\/(\d+)$/))) {
    const p = properties.find(p => p.id === Number(x![1]) && p.status !== 'DELETED')
    if (!p) throw new ApiError(404, 'Property not found')
    return r(detail(p))
  }
  if (method === 'POST' && path === '/properties') {
    const u = requireUser('SELLER')
    const at = new Date().toISOString()
    const p = { id: nextId(), ownerId: u.id, listingType: 'SALE', city: 'Gwalior', images: [], status: 'ACTIVE', viewCount: 0,
      isOwner: true, favourited: false, featured: false, trust: { contactVerified: false, ownershipDocumentsReviewed: false, directOwner: true },
      createdAt: at } as unknown as DemoProperty
    applyRequest(p, body as unknown as PropertyRequest)
    const dup = properties.find(o => o.ownerId === u.id && o.locality.id === p.locality.id && o.propertyType === p.propertyType && Math.abs(o.price - p.price) <= o.price * 0.02)
    p.possibleDuplicateOf = dup?.id
    properties.push(p)
    log(u.id, 'PROPERTY_CREATED', 'PROPERTY', p.id, p.title)
    return r(detail(p))
  }
  if (method === 'PUT' && (x = m(/^\/properties\/(\d+)$/))) {
    const u = requireUser()
    const p = owned(Number(x[1]), u)
    if (p.status === 'SOLD') throw new ApiError(400, 'A sold listing cannot be edited')
    applyRequest(p, body as unknown as PropertyRequest)
    log(u.id, 'PROPERTY_UPDATED', 'PROPERTY', p.id)
    return r(detail(p))
  }
  if (method === 'DELETE' && (x = m(/^\/properties\/(\d+)$/))) {
    const u = requireUser(); const p = owned(Number(x[1]), u); p.status = 'DELETED'
    log(u.id, 'PROPERTY_STATUS_DELETED', 'PROPERTY', p.id); return r(undefined)
  }
  if (method === 'POST' && (x = m(/^\/properties\/(\d+)\/(pause|activate|mark-sold)$/))) {
    const u = requireUser(); const p = owned(Number(x[1]), u)
    const ok = { pause: p.status === 'ACTIVE', activate: p.status === 'PAUSED', 'mark-sold': p.status === 'ACTIVE' || p.status === 'PAUSED' }[x[2] as 'pause']
    if (!ok) throw new ApiError(400, `Cannot change a ${p.status.toLowerCase()} listing`)
    p.status = x[2] === 'pause' ? 'PAUSED' : x[2] === 'activate' ? 'ACTIVE' : 'SOLD'
    log(u.id, `PROPERTY_STATUS_${p.status}`, 'PROPERTY', p.id); return r(undefined)
  }
  if (method === 'POST' && (x = m(/^\/properties\/(\d+)\/images$/))) {
    const u = requireUser(); const p = owned(Number(x[1]), u)
    const f = (rawBody as FormData).get('file') as File
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) throw new ApiError(400, 'Only JPEG, PNG or WebP images are allowed')
    if (f.size > 8 * 1024 * 1024) throw new ApiError(400, 'Image is larger than 8 MB')
    if (p.images.length >= 20) throw new ApiError(400, 'A listing can have at most 20 photos')
    const img = { id: nextId(), url: await readFile(f), sortOrder: p.images.length }
    p.images.push(img)
    return r(img)
  }
  if (method === 'DELETE' && (x = m(/^\/properties\/(\d+)\/images\/(\d+)$/))) {
    const u = requireUser(); const p = owned(Number(x[1]), u)
    p.images = p.images.filter(i => i.id !== Number(x![2])); return r(undefined)
  }
  if (method === 'GET' && path === '/me/properties') {
    const u = requireUser()
    const mine = properties.filter(p => p.ownerId === u.id && p.status !== 'DELETED')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(p => ({ card: card(p), status: p.status, moderationStatus: p.moderationStatus, moderationNote: p.moderationNote,
        viewCount: p.viewCount, enquiryCount: enquiries.filter(e => e.propertyId === p.id).length,
        visitRequestCount: visits.filter(v => v.propertyId === p.id).length, featuredUntil: p.featuredUntil }))
    return r(page(mine))
  }

  // favourites
  if ((method === 'PUT' || method === 'DELETE') && (x = m(/^\/properties\/(\d+)\/favourite$/))) {
    const u = requireUser(); const key = `${u.id}:${x[1]}`
    if (method === 'PUT') { if (!visible(findProp(Number(x[1])))) throw new ApiError(404, 'Property not found'); favourites.add(key) }
    else favourites.delete(key)
    return r(undefined)
  }
  if (method === 'GET' && path === '/me/favourites') {
    const u = requireUser()
    const list = [...favourites].filter(k => k.startsWith(`${u.id}:`)).map(k => properties.find(p => p.id === Number(k.split(':')[1])))
      .filter((p): p is DemoProperty => !!p && p.status !== 'DELETED').map(card)
    return r(page(list, 0, 24))
  }

  // reports
  if (method === 'POST' && (x = m(/^\/properties\/(\d+)\/reports$/))) {
    const p = findProp(Number(x[1]))
    if (!body?.reason) throw new ApiError(400, 'Some fields are invalid', { reason: 'must not be null' })
    const rep = { id: nextId(), propertyId: p.id, reason: String(body.reason), details: body.details as string | undefined, status: 'OPEN', createdAt: new Date().toISOString() }
    reports.push(rep)
    log(currentUser()?.id, 'LISTING_REPORTED', 'PROPERTY', p.id, `reason=${rep.reason}`)
    return r({ id: rep.id, message: 'Thank you. Our team will review this listing.' })
  }

  // enquiries
  if (method === 'POST' && (x = m(/^\/properties\/(\d+)\/enquiries$/))) {
    const u = requireUser(); const p = findProp(Number(x[1]))
    if (!visible(p)) throw new ApiError(404, 'Property not found')
    if (p.ownerId === u.id) throw new ApiError(400, 'You cannot enquire about your own listing')
    const msg = String(body?.message ?? '').trim()
    if (msg.length < 10) throw new ApiError(400, 'Some fields are invalid', { message: 'must be 10 to 1000 characters' })
    if (enquiries.filter(e => e.buyerId === u.id && e.propertyId === p.id && Date.now() - new Date(e.createdAt).getTime() < DAY).length >= 3)
      throw new ApiError(400, 'You have already sent several enquiries for this property today')
    const at = new Date().toISOString()
    const e = { id: nextId(), propertyId: p.id, propertyTitle: p.title, buyerId: u.id, ownerId: p.ownerId, sharePhone: !!body?.sharePhone,
      counterpartName: '', message: msg, status: 'NEW' as const, createdAt: at, updatedAt: at }
    enquiries.push(e)
    log(u.id, 'ENQUIRY_CREATED', 'ENQUIRY', e.id, `property=${p.id}`)
    return r(enquiryView(e, false))
  }
  if (method === 'POST' && (x = m(/^\/enquiries\/(\d+)\/reply$/))) {
    const u = requireUser(); const e = enquiries.find(e => e.id === Number(x![1]))
    if (!e) throw new ApiError(404, 'Enquiry not found')
    if (e.ownerId !== u.id) throw new ApiError(403, 'You are not allowed to perform this action')
    e.ownerReply = String(body?.reply ?? '').trim(); e.status = 'REPLIED'; e.updatedAt = new Date().toISOString()
    log(u.id, 'ENQUIRY_REPLIED', 'ENQUIRY', e.id)
    return r(enquiryView(e, true))
  }
  if (method === 'GET' && path === '/me/enquiries/received') {
    const u = requireUser()
    const list = enquiries.filter(e => e.ownerId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const out = list.map(e => enquiryView(e, true))
    list.forEach(e => { if (e.status === 'NEW') e.status = 'READ' })
    return r(page(out))
  }
  if (method === 'GET' && path === '/me/enquiries/sent') {
    const u = requireUser()
    return r(page(enquiries.filter(e => e.buyerId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(e => enquiryView(e, false))))
  }

  // visits
  if (method === 'POST' && (x = m(/^\/properties\/(\d+)\/visits$/))) {
    const u = requireUser(); const p = findProp(Number(x[1]))
    if (!visible(p)) throw new ApiError(404, 'Property not found')
    if (p.ownerId === u.id) throw new ApiError(400, 'You cannot book a visit to your own listing')
    reasonableTime(String(body?.preferredAt))
    if (visits.some(v => v.buyerId === u.id && v.propertyId === p.id && ['REQUESTED', 'ACCEPTED', 'RESCHEDULE_PROPOSED'].includes(v.status)))
      throw new ApiError(409, 'You already have an open visit request for this property')
    const at = new Date().toISOString()
    const v = { id: nextId(), propertyId: p.id, propertyTitle: p.title, locality: p.locality.name, buyerId: u.id, ownerId: p.ownerId,
      counterpartName: '', preferredAt: String(body?.preferredAt), scheduledAt: '', status: 'REQUESTED' as const,
      buyerNote: (body?.note as string) || undefined, createdAt: at, updatedAt: at }
    visits.push(v)
    log(u.id, 'VISIT_REQUESTED', 'SITE_VISIT', v.id, `property=${p.id}`)
    return r(visitView(v, false))
  }
  if (method === 'POST' && (x = m(/^\/visits\/(\d+)\/(accept|reject|propose|accept-proposal|cancel|complete)$/))) {
    const u = requireUser(); const id = Number(x[1])
    const note = (body?.note as string) || undefined
    switch (x[2]) {
      case 'accept': return r(visitTransition(id, u, 'owner', ['REQUESTED'], v => { v.status = 'ACCEPTED'; v.ownerNote = note }, 'VISIT_ACCEPTED'))
      case 'reject': return r(visitTransition(id, u, 'owner', ['REQUESTED', 'RESCHEDULE_PROPOSED'], v => { v.status = 'REJECTED'; v.ownerNote = note }, 'VISIT_REJECTED'))
      case 'propose': reasonableTime(String(body?.proposedAt))
        return r(visitTransition(id, u, 'owner', ['REQUESTED', 'RESCHEDULE_PROPOSED', 'ACCEPTED'], v => { v.status = 'RESCHEDULE_PROPOSED'; v.proposedAt = String(body?.proposedAt); v.ownerNote = note }, 'VISIT_RESCHEDULE_PROPOSED'))
      case 'accept-proposal': return r(visitTransition(id, u, 'buyer', ['RESCHEDULE_PROPOSED'], v => { v.status = 'ACCEPTED' }, 'VISIT_PROPOSAL_ACCEPTED'))
      case 'cancel': return r(visitTransition(id, u, 'buyer', ['REQUESTED', 'RESCHEDULE_PROPOSED', 'ACCEPTED'], v => { v.status = 'CANCELLED' }, 'VISIT_CANCELLED'))
      case 'complete': return r(visitTransition(id, u, 'owner', ['ACCEPTED'], v => {
        if (new Date(visitView(v, true).scheduledAt).getTime() > Date.now()) throw new ApiError(400, 'A visit can only be marked completed after its scheduled time')
        v.status = 'COMPLETED'
      }, 'VISIT_COMPLETED'))
    }
  }
  if (method === 'GET' && path === '/me/visits/received') {
    const u = requireUser()
    return r(page(visits.filter(v => v.ownerId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(v => visitView(v, true))))
  }
  if (method === 'GET' && path === '/me/visits/requested') {
    const u = requireUser()
    return r(page(visits.filter(v => v.buyerId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(v => visitView(v, false))))
  }

  // admin
  if (path.startsWith('/admin/')) {
    const admin = requireUser('ADMIN')
    if (method === 'GET' && path === '/admin/stats') return r({
      totalUsers: users.length, activeListings: properties.filter(visible).length,
      pendingModeration: properties.filter(p => p.moderationStatus === 'PENDING' && p.status !== 'DELETED').length,
      totalEnquiries: enquiries.length, visitsRequested: visits.length, visitsCompleted: visits.filter(v => v.status === 'COMPLETED').length,
      openReports: reports.filter(x => x.status === 'OPEN').length, manualFeaturedPromotions: properties.filter(isFeatured).length,
      paidFeaturedPromotions: 0, revenueNote: 'No revenue is recorded yet: payment gateway is not integrated.',
    })
    if (method === 'GET' && path === '/admin/properties/pending') return r(page(properties
      .filter(p => p.moderationStatus === 'PENDING' && p.status !== 'DELETED')
      .map(p => ({ id: p.id, title: p.title, ownerName: userById(p.ownerId).fullName, ownerEmail: userById(p.ownerId).email,
        locality: p.locality.name, price: p.price, propertyType: p.propertyType, possibleDuplicateOf: p.possibleDuplicateOf,
        imageCount: p.images.length, createdAt: p.createdAt }))))
    if (method === 'POST' && (x = m(/^\/admin\/properties\/(\d+)\/(approve|reject)$/))) {
      const p = findProp(Number(x[1]))
      if (x[2] === 'reject') {
        if (!body?.note || !String(body.note).trim()) throw new ApiError(400, 'Please give the owner a reason for rejection')
        p.moderationStatus = 'REJECTED'; p.moderationNote = String(body.note)
      } else {
        p.moderationStatus = 'APPROVED'; p.moderationNote = undefined; p.publishedAt ??= new Date().toISOString()
      }
      log(admin.id, x[2] === 'approve' ? 'LISTING_APPROVED' : 'LISTING_REJECTED', 'PROPERTY', p.id); return r(undefined)
    }
    if (method === 'POST' && (x = m(/^\/admin\/properties\/(\d+)\/promotions$/))) {
      const p = findProp(Number(x[1]))
      if (!visible(p)) throw new ApiError(400, 'Only active, approved listings can be featured')
      const pkg = PACKAGES.find(k => k.id === Number(body?.packageId))
      if (!pkg) throw new ApiError(400, 'Unknown or inactive package')
      const start = isFeatured(p) ? new Date(p.featuredUntil!).getTime() : Date.now()
      p.featuredUntil = new Date(start + pkg.durationDays * DAY).toISOString()
      log(admin.id, 'LISTING_FEATURED', 'PROPERTY', p.id, `${pkg.code} until ${p.featuredUntil}`)
      return r({ featuredUntil: p.featuredUntil })
    }
    if (method === 'POST' && (x = m(/^\/admin\/properties\/(\d+)\/contact-verified/))) {
      const p = findProp(Number(x[1])); p.trust = { ...p.trust, contactVerified: true }
      log(admin.id, 'CONTACT_VERIFIED', 'PROPERTY', p.id); return r(undefined)
    }
    if (method === 'GET' && path === '/admin/reports') return r(page(reports.filter(x => x.status === 'OPEN')
      .map(x => ({ id: x.id, propertyId: x.propertyId, propertyTitle: findProp(x.propertyId).title, reason: x.reason, details: x.details, createdAt: x.createdAt }))))
    if (method === 'POST' && (x = m(/^\/admin\/reports\/(\d+)\/resolve$/))) {
      const rep = reports.find(z => z.id === Number(x![1]))
      if (!rep) throw new ApiError(404, 'Report not found')
      rep.status = String(body?.outcome)
      const p = findProp(rep.propertyId)
      if (body?.pauseListing && p.status === 'ACTIVE') { p.status = 'PAUSED'; p.moderationNote = 'Paused after a report review' }
      log(admin.id, 'REPORT_RESOLVED', 'REPORT', rep.id, `outcome=${body?.outcome}`); return r(undefined)
    }
    if (method === 'GET' && path === '/admin/users') {
      const q = String(query.q ?? '').toLowerCase()
      return r(page(users.filter(u => !q || (u.fullName + u.email + u.phone).toLowerCase().includes(q))
        .map(u => ({ id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, roles: u.roles, status: u.status, createdAt: u.createdAt }))))
    }
    if (method === 'POST' && (x = m(/^\/admin\/users\/(\d+)\/(suspend|reinstate)$/))) {
      if (Number(x[1]) === admin.id) throw new ApiError(400, 'You cannot change your own account status')
      const u = userById(Number(x[1])); u.status = x[2] === 'suspend' ? 'SUSPENDED' : 'ACTIVE'
      log(admin.id, `USER_${u.status}`, 'USER', u.id); return r(undefined)
    }
    if (method === 'GET' && path === '/admin/promotion-packages') return r(PACKAGES)
    if (method === 'GET' && path === '/admin/audit-logs') return r(page(audit, 0, 50))
  }

  throw new ApiError(404, 'Not found')
}
