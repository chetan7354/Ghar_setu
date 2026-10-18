import { api } from './client'
import type * as T from './types'

export const Auth = {
  register: (b: { fullName: string; email: string; phone: string; password: string; accountType: 'BUYER' | 'SELLER' }) =>
    api.post<T.AuthResponse>('/auth/register', b),
  login: (b: { email: string; password: string }) => api.post<T.AuthResponse>('/auth/login', b),
  me: () => api.get<T.User>('/me'),
  becomeSeller: () => api.post<T.AuthResponse>('/me/become-seller'),
}

export const Reference = {
  localities: (city = 'gwalior') => api.get<T.Locality[]>(`/cities/${city}/localities`),
  amenities: () => api.get<T.Amenity[]>('/amenities'),
  packages: () => api.get<T.PromotionPackage[]>('/promotion-packages'),
}

export const Properties = {
  search: (p: T.SearchParams) => api.get<T.Page<T.PropertyCard>>('/properties', { ...p }),
  featured: () => api.get<T.PropertyCard[]>('/properties/featured'),
  recent: () => api.get<T.PropertyCard[]>('/properties/recent'),
  get: (id: number) => api.get<T.PropertyDetail>(`/properties/${id}`),
  create: (b: T.PropertyRequest) => api.post<T.PropertyDetail>('/properties', b),
  update: (id: number, b: T.PropertyRequest) => api.put<T.PropertyDetail>(`/properties/${id}`, b),
  remove: (id: number) => api.del<void>(`/properties/${id}`),
  pause: (id: number) => api.post<void>(`/properties/${id}/pause`),
  activate: (id: number) => api.post<void>(`/properties/${id}/activate`),
  markSold: (id: number) => api.post<void>(`/properties/${id}/mark-sold`),
  uploadImage: (id: number, file: File) => {
    const f = new FormData()
    f.append('file', file)
    return api.post<{ id: number; url: string; sortOrder: number }>(`/properties/${id}/images`, f)
  },
  deleteImage: (id: number, imageId: number) => api.del<void>(`/properties/${id}/images/${imageId}`),
  mine: () => api.get<T.Page<T.MyListing>>('/me/properties'),
  favourite: (id: number) => api.put<void>(`/properties/${id}/favourite`),
  unfavourite: (id: number) => api.del<void>(`/properties/${id}/favourite`),
  favourites: () => api.get<T.Page<T.PropertyCard>>('/me/favourites'),
  report: (id: number, b: { reason: string; details?: string }) =>
    api.post<{ id: number; message: string }>(`/properties/${id}/reports`, b),
}

export const Enquiries = {
  create: (propertyId: number, b: { message: string; sharePhone: boolean }) =>
    api.post<T.Enquiry>(`/properties/${propertyId}/enquiries`, b),
  reply: (id: number, reply: string) => api.post<T.Enquiry>(`/enquiries/${id}/reply`, { reply }),
  received: () => api.get<T.Page<T.Enquiry>>('/me/enquiries/received'),
  sent: () => api.get<T.Page<T.Enquiry>>('/me/enquiries/sent'),
}

export const Visits = {
  request: (propertyId: number, b: { preferredAt: string; note?: string }) =>
    api.post<T.Visit>(`/properties/${propertyId}/visits`, b),
  accept: (id: number, note?: string) => api.post<T.Visit>(`/visits/${id}/accept`, { note }),
  reject: (id: number, note?: string) => api.post<T.Visit>(`/visits/${id}/reject`, { note }),
  propose: (id: number, proposedAt: string, note?: string) => api.post<T.Visit>(`/visits/${id}/propose`, { proposedAt, note }),
  acceptProposal: (id: number) => api.post<T.Visit>(`/visits/${id}/accept-proposal`),
  cancel: (id: number) => api.post<T.Visit>(`/visits/${id}/cancel`),
  complete: (id: number) => api.post<T.Visit>(`/visits/${id}/complete`),
  received: () => api.get<T.Page<T.Visit>>('/me/visits/received'),
  requested: () => api.get<T.Page<T.Visit>>('/me/visits/requested'),
}

export const Admin = {
  stats: () => api.get<T.AdminStats>('/admin/stats'),
  pending: () => api.get<T.Page<T.ModerationItem>>('/admin/properties/pending'),
  approve: (id: number, note?: string) => api.post<void>(`/admin/properties/${id}/approve`, { note }),
  reject: (id: number, note: string) => api.post<void>(`/admin/properties/${id}/reject`, { note }),
  feature: (id: number, packageId: number) => api.post<{ featuredUntil: string }>(`/admin/properties/${id}/promotions`, { packageId }),
  contactVerified: (id: number, value: boolean) => api.post<void>(`/admin/properties/${id}/contact-verified?value=${value}`),
  reports: () => api.get<T.Page<T.ReportItem>>('/admin/reports'),
  resolveReport: (id: number, outcome: 'ACTION_TAKEN' | 'DISMISSED', pauseListing: boolean) =>
    api.post<void>(`/admin/reports/${id}/resolve`, { outcome, pauseListing }),
  users: (q?: string) => api.get<T.Page<T.AdminUser>>('/admin/users', { q }),
  suspend: (id: number) => api.post<void>(`/admin/users/${id}/suspend`),
  reinstate: (id: number) => api.post<void>(`/admin/users/${id}/reinstate`),
  packages: () => api.get<T.PromotionPackage[]>('/admin/promotion-packages'),
  audit: () => api.get<T.Page<T.AuditItem>>('/admin/audit-logs'),
}
