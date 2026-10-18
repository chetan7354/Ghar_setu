export type Role = 'BUYER' | 'SELLER' | 'BUILDER' | 'ADMIN'
export type Category = 'RESIDENTIAL' | 'COMMERCIAL' | 'LAND'
export type PropertyType =
  | 'APARTMENT' | 'INDEPENDENT_HOUSE' | 'VILLA' | 'BUILDER_FLOOR' | 'PLOT' | 'AGRICULTURAL_LAND'
  | 'SHOP' | 'OFFICE' | 'WAREHOUSE' | 'OTHER_COMMERCIAL'
export type AreaUnit = 'SQFT' | 'SQYD' | 'SQM'
export type Furnishing = 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FULLY_FURNISHED'
export type Possession = 'READY' | 'UNDER_CONSTRUCTION'
export type ContactPreference = 'CALL' | 'CHAT' | 'BOTH'
export type ListingStatus = 'ACTIVE' | 'PAUSED' | 'SOLD' | 'DELETED'
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type SortOrder = 'relevance' | 'newest' | 'price_asc' | 'price_desc'

export interface User {
  id: number; fullName: string; email: string; phone: string; roles: Role[]
  emailVerified: boolean; phoneVerified: boolean
}
export interface AuthResponse { token: string; user: User }

export interface Page<T> { items: T[]; page: number; size: number; totalItems: number; totalPages: number }

export interface LocalityRef { id: number; name: string; slug: string }
export interface Locality extends LocalityRef { pinCode: string | null; popular: boolean }
export interface Amenity { code: string; label: string }
export interface Trust { contactVerified: boolean; ownershipDocumentsReviewed: boolean; directOwner: boolean }

export interface PropertyCard {
  id: number; title: string; propertyType: PropertyType; category: Category; price: number
  priceNegotiable: boolean; builtUpArea?: number; plotArea?: number; areaUnit: AreaUnit
  bedrooms?: number; bathrooms?: number; furnishing?: Furnishing; possession: Possession
  locality: LocalityRef; city: string; coverImageUrl?: string; featured: boolean; trust: Trust
  publishedAt?: string
}

export interface PropertyDetail extends Omit<PropertyCard, 'coverImageUrl'> {
  listingType: 'SALE' | 'RENT'; propertyAgeYears?: number; description: string; addressLine: string
  pinCode: string; latitude?: number; longitude?: number; images: { id: number; url: string; sortOrder: number }[]
  amenities: string[]; amenityCodes: string[]
  owner?: { id: number; name: string; contactPreference: ContactPreference; phone?: string; phoneHidden: boolean }
  featuredUntil?: string; status: ListingStatus; moderationStatus: ModerationStatus; moderationNote?: string
  isOwner: boolean; favourited: boolean; viewCount: number; createdAt: string; updatedAt: string
  contactPreference?: ContactPreference
}

export interface PropertyRequest {
  title: string; propertyType: PropertyType; price: number; priceNegotiable: boolean
  builtUpArea?: number | null; plotArea?: number | null; areaUnit: AreaUnit
  bedrooms?: number | null; bathrooms?: number | null; furnishing?: Furnishing | null
  propertyAgeYears?: number | null; possession: Possession; description: string; addressLine: string
  localityId: number; pinCode: string; latitude?: number | null; longitude?: number | null
  contactPreference: ContactPreference; showPhone: boolean; amenityCodes: string[]
}

export interface MyListing {
  card: PropertyCard; status: ListingStatus; moderationStatus: ModerationStatus; moderationNote?: string
  viewCount: number; enquiryCount: number; visitRequestCount: number; featuredUntil?: string
}

export interface Enquiry {
  id: number; propertyId: number; propertyTitle: string; counterpartName: string; counterpartPhone?: string
  message: string; ownerReply?: string; status: 'NEW' | 'READ' | 'REPLIED' | 'CLOSED'; createdAt: string; updatedAt: string
}

export type VisitStatus = 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'RESCHEDULE_PROPOSED' | 'CANCELLED' | 'COMPLETED'
export interface Visit {
  id: number; propertyId: number; propertyTitle: string; locality: string; counterpartName: string
  counterpartPhone?: string; preferredAt: string; proposedAt?: string; scheduledAt: string; status: VisitStatus
  buyerNote?: string; ownerNote?: string; createdAt: string; updatedAt: string
}

export interface PromotionPackage { id: number; code: string; name: string; durationDays: number; price: number; active: boolean }

export interface AdminStats {
  totalUsers: number; activeListings: number; pendingModeration: number; totalEnquiries: number
  visitsRequested: number; visitsCompleted: number; openReports: number
  manualFeaturedPromotions: number; paidFeaturedPromotions: number; revenueNote: string
}
export interface ModerationItem {
  id: number; title: string; ownerName: string; ownerEmail: string; locality: string; price: number
  propertyType: PropertyType; possibleDuplicateOf?: number; imageCount: number; createdAt: string
}
export interface ReportItem { id: number; propertyId: number; propertyTitle: string; reason: string; details?: string; createdAt: string }
export interface AdminUser { id: number; fullName: string; email: string; phone: string; roles: Role[]; status: 'ACTIVE' | 'SUSPENDED'; createdAt: string }
export interface AuditItem { id: number; actorId?: number; action: string; entityType: string; entityId?: number; details?: string; createdAt: string }

export interface SearchParams {
  city?: string; locality?: string; category?: Category; type?: PropertyType; minPrice?: number; maxPrice?: number
  minBedrooms?: number; minArea?: number; maxArea?: number; furnishing?: Furnishing; possession?: Possession
  featured?: boolean; verified?: boolean; q?: string; sort?: SortOrder; page?: number; size?: number
}

export interface ApiErrorBody { status: number; message: string; fieldErrors?: { field: string; message: string }[] }
