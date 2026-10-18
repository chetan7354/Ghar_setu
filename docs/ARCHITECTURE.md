# GharSetu: Architecture & Plan

> **GharSetu** ("bridge to home") is a working brand name. It is set in one place
> (`frontend/src/brand.ts`, `app.brand-name` in backend config) so it can be
> changed before launch. Check trademark availability before committing to it.

## 0. Reference analysis: what was and was not inspected

The four reference sites (99acres, MagicBricks, NoBroker, Housing.com) **could not be
opened** from the build environment: its network policy refused the connections
(HTTP 403 at the proxy). **No page of these sites has been inspected for this project.**

The UI direction below therefore comes from the written requirements and general
real-estate UX conventions (search-first homepage, filter sidebar, card grids,
gallery-first detail pages), not from studying those sites. To do a real reference
review, share screenshots of the screens you like (homepage, search, detail page,
post-property flow, owner dashboard) and they will be compared against this UI.

Original design direction:
- **Palette:** deep teal `#0F4C5C` (trust), warm saffron `#E8A33D` (Gwalior fort
  sandstone, accents), off-white `#FAF8F4` background, slate text.
- **Type:** "Plus Jakarta Sans" for headings and body.
- **Signature elements:** a "Direct from owner" ribbon, a two-level trust badge
  (Contact verified vs. Ownership documents reviewed, never "legally verified"),
  locality chips for Gwalior (City Centre, Thatipur, DD Nagar, Morar, Lashkar, ...).
- **Mobile first:** sticky bottom action bar on detail pages (Enquire / Book visit),
  filters as a bottom sheet on phones.

## 1. Architecture

```
 Browser (React + TS + Tailwind, Vite)
        │  HTTPS, JSON, JWT Bearer token
        ▼
 Spring Boot 3.5 REST API (Java 21)
   ├─ Spring Security (JWT filter, BCrypt, method-level @PreAuthorize)
   ├─ Controllers → Services (business rules, ownership checks) → JPA Repositories
   ├─ Flyway migrations
   ├─ Rate limiter (in-memory token bucket; Redis when >1 instance)
   ├─ ImageStorage port ──► LocalDiskStorage (dev) | CloudinaryStorage (pending creds)
   ├─ Notifier port ──────► LogOnlyNotifier (until email/SMS provider configured)
   └─ AuditLogService (append-only)
        │
        ▼
 MySQL 8 (utf8mb4)
```

Modular monolith: one deployable, packages split by feature (`auth`, `property`,
`enquiry`, `visit`, `report`, `admin`, `promotion`, `audit`). Future modules
(`payment`, `subscription`, `builder`, `service`, `transaction`) plug in as new
packages without changing existing tables.

Multi-city / rentals readiness: `cities` and `localities` are tables (Gwalior is seed
data, not a constant); `properties.listing_type` is `SALE` now with `RENT` reserved.

## 2. Folder structure

```
real-estate/
├─ README.md                 setup, PowerShell commands, feature checklist
├─ docs/ARCHITECTURE.md      this file
├─ backend/
│  ├─ pom.xml
│  └─ src/main/java/in/gharsetu/
│     ├─ GharSetuApplication.java
│     ├─ config/       SecurityConfig, CorsConfig, properties
│     ├─ common/       ApiError, GlobalExceptionHandler, PageResponse, RateLimiter
│     ├─ auth/         User, Role, JwtService, AuthController
│     ├─ location/     City, Locality
│     ├─ property/     Property, PropertyImage, Amenity, search spec, controllers
│     ├─ storage/      ImageStorage, LocalDiskStorage, CloudinaryStorage
│     ├─ favourite/
│     ├─ enquiry/
│     ├─ visit/        SiteVisitRequest + state machine
│     ├─ report/       ReportedListing
│     ├─ promotion/    PromotionPackage, ListingPromotion (manual, phase 1)
│     ├─ admin/        moderation, stats
│     └─ audit/        AuditLog
│  └─ src/main/resources/
│     ├─ application.yml
│     └─ db/migration/V1__core_schema.sql, V2__seed_reference_data.sql
└─ frontend/
   ├─ package.json, vite.config.ts, tailwind config
   └─ src/
      ├─ api/          typed API client
      ├─ components/   Header, Footer, PropertyCard, SearchBar, Filters, Badge…
      ├─ pages/        Home, Search, PropertyDetail, Sell, Login, Register,
      │                BuyerDashboard, SellerDashboard, AdminDashboard, static pages
      ├─ auth/         AuthContext, ProtectedRoute
      └─ brand.ts
```

## 3. Database schema (MVP, migrated in `V1__core_schema.sql`)

| Table | Key columns | Relations / indexes |
|---|---|---|
| `users` | id BIGINT PK, full_name, email UNIQUE, phone UNIQUE, password_hash, email_verified_at, phone_verified_at, status (ACTIVE/SUSPENDED), created_at, updated_at | |
| `roles` | id PK, name UNIQUE (BUYER, SELLER, BUILDER, ADMIN) | |
| `user_roles` | user_id FK, role_id FK, PK(user_id, role_id) | |
| `cities` | id PK, name, state, slug UNIQUE, active | |
| `localities` | id PK, city_id FK, name, slug, pin_code, popular | UNIQUE(city_id, slug) |
| `amenities` | id PK, code UNIQUE, label | |
| `properties` | id PK, owner_id FK users, title, category (RESIDENTIAL/COMMERCIAL/LAND), property_type (APARTMENT, INDEPENDENT_HOUSE, VILLA, PLOT, SHOP, OFFICE, OTHER), listing_type (SALE), price DECIMAL(14,2), price_negotiable, built_up_area, plot_area, area_unit (SQFT/SQYD/SQM), bedrooms, bathrooms, furnishing, property_age_years, possession (READY/UNDER_CONSTRUCTION), description TEXT, address_line, locality_id FK, city_id FK, pin_code, latitude, longitude, contact_preference (CALL/CHAT/BOTH), show_phone, status (DRAFT/ACTIVE/PAUSED/SOLD/DELETED), moderation_status (PENDING/APPROVED/REJECTED), moderation_note, contact_verified, ownership_verified_at, featured_until, view_count, created_at, updated_at, published_at, version | idx(city_id, status, moderation_status, price), idx(locality_id), idx(property_type), idx(bedrooms), idx(created_at), idx(featured_until), idx(owner_id) |
| `property_images` | id PK, property_id FK, storage_key, url, sort_order, created_at | idx(property_id, sort_order) |
| `property_amenities` | property_id FK, amenity_id FK, PK(both) | |
| `favourites` | user_id FK, property_id FK, created_at, PK(both) | |
| `enquiries` | id PK, property_id FK, buyer_id FK, owner_id FK (denormalised for inbox queries), message, buyer_phone_shared, status (NEW/READ/REPLIED/CLOSED), owner_reply, created_at, updated_at | idx(owner_id, created_at), idx(buyer_id), idx(property_id) |
| `site_visit_requests` | id PK, property_id FK, buyer_id FK, owner_id FK, enquiry_id FK NULL, preferred_at DATETIME, proposed_at DATETIME NULL, status (REQUESTED/ACCEPTED/REJECTED/RESCHEDULE_PROPOSED/CANCELLED/COMPLETED), buyer_note, owner_note, created_at, updated_at, version | idx(owner_id, status), idx(buyer_id, status) |
| `reported_listings` | id PK, property_id FK, reporter_id FK NULL, reason (FAKE/DUPLICATE/WRONG_PRICE/SOLD/BROKER_POSING_AS_OWNER/OTHER), details, status (OPEN/ACTION_TAKEN/DISMISSED), resolved_by FK NULL, resolved_at, created_at | idx(status) |
| `verification_requests` | id PK, user_id FK, property_id FK NULL, type (CONTACT/OWNERSHIP_DOCUMENTS), document_key (private storage, never public), status (PENDING/APPROVED/REJECTED), admin_note, decided_by, decided_at, created_at | idx(status) |
| `promotion_packages` | id PK, code UNIQUE, name, duration_days, price DECIMAL, active | |
| `listing_promotions` | id PK, property_id FK, package_id FK, starts_at, ends_at, source (ADMIN_MANUAL/PAYMENT), created_by FK, created_at | idx(property_id, ends_at) |
| `audit_logs` | id PK, actor_id FK NULL, action, entity_type, entity_id, details JSON, ip, created_at | idx(entity_type, entity_id), idx(actor_id), idx(created_at) |

Deferred (designed, not migrated yet): `seller_profiles`, `builder_profiles`,
`projects`, `subscription_plans`, `subscriptions`, `payments`, `invoices`, `refunds`,
`transaction_records`, `service_requests`, `notifications`. Each will arrive as its own
`V<n>__*.sql` migration with FKs to `users`/`properties`. Payments will store only
gateway order/payment IDs and webhook-verified status, never card data.

Duplicate detection (MVP, practical): on create, flag listings by the same owner or the
same phone with the same locality + type + price ±2% + area ±5% for moderation.

## 4. API endpoints (base `/api/v1`)

Auth & profile
- `POST /auth/register` {fullName, email, phone, password, accountType: BUYER|SELLER}
- `POST /auth/login` {email, password} → {token, user}
- `GET  /me`, `PATCH /me`

Reference data (public)
- `GET /cities`, `GET /cities/{slug}/localities`, `GET /amenities`

Properties
- `GET  /properties` search: `city, locality, category, type, minPrice, maxPrice, minBedrooms, minArea, maxArea, furnishing, possession, featured, verified, sort=newest|price_asc|price_desc, page, size`
- `GET  /properties/{id}` (public only if ACTIVE+APPROVED, otherwise owner/admin)
- `GET  /properties/featured`, `GET /properties/recent`
- `POST /properties` (SELLER) · `PUT /properties/{id}` (owner) · `DELETE /properties/{id}` (owner, soft)
- `POST /properties/{id}/pause|activate|mark-sold` (owner)
- `POST /properties/{id}/images` multipart (owner) · `DELETE /properties/{id}/images/{imageId}`
- `GET  /me/properties` (owner listings with enquiry/visit counts)

Favourites
- `GET /me/favourites` · `PUT /properties/{id}/favourite` · `DELETE /properties/{id}/favourite`

Enquiries
- `POST /properties/{id}/enquiries` (logged in, rate limited)
- `GET  /me/enquiries/sent` · `GET /me/enquiries/received`
- `POST /enquiries/{id}/reply` (owner)

Site visits
- `POST /properties/{id}/visits` {preferredAt, note}
- `GET  /me/visits/requested` · `GET /me/visits/received`
- `POST /visits/{id}/accept|reject|propose` (owner) · `POST /visits/{id}/accept-proposal|cancel` (buyer) · `POST /visits/{id}/complete` (owner)

Reports
- `POST /properties/{id}/reports` (anonymous allowed, rate limited)

Admin (ADMIN role)
- `GET /admin/stats`
- `GET /admin/properties?moderation=PENDING` · `POST /admin/properties/{id}/approve|reject`
- `GET /admin/reports` · `POST /admin/reports/{id}/resolve`
- `GET /admin/users` · `POST /admin/users/{id}/suspend|reinstate`
- `GET/POST /admin/promotion-packages` · `POST /admin/properties/{id}/promotions` (manual feature)
- `GET /admin/audit-logs`

Errors use one shape: `{status, error, message, fieldErrors[], path, timestamp}`.

## 5. User journeys

**Buyer:** Home → search "3 BHK Thatipur under 60L" → results (server-side filters,
paginated) → detail (gallery, specs, trust badges) → *Enquire* (login prompt if needed)
→ owner gets it in dashboard → buyer *Book visit* with date/time → owner accepts /
rejects / proposes time → buyer accepts proposal → visit shows ACCEPTED in both
dashboards → owner marks COMPLETED after visit. Every transition writes an audit row.

**Owner:** Register as seller → *Sell property* multi-step form (basics → location →
details & amenities → photos → review) → listing saved as ACTIVE + PENDING moderation →
admin approves → visible in search → owner manages enquiries, visits, pause/sold.

**Admin:** Login → dashboard counts → moderation queue → approve/reject with note →
reports queue → feature a listing manually with a package → audit log.

Site-visit state machine:
```
REQUESTED ─accept→ ACCEPTED ─complete→ COMPLETED
    │ reject→ REJECTED
    │ propose→ RESCHEDULE_PROPOSED ─buyer accept→ ACCEPTED
    │                              └─owner/buyer re-propose→ RESCHEDULE_PROPOSED
any open state ─buyer cancel→ CANCELLED
```

## 6. Security considerations

- BCrypt (strength 12) password hashing; JWT HS256 with secret from `JWT_SECRET` env
  (≥32 bytes), 24h expiry; no secrets in source control (`.env.example` only).
- Authorisation in the backend: `@PreAuthorize` on role, plus service-level ownership
  checks (`property.owner == currentUser`) for every edit/delete/visit action.
- Bean Validation on all request DTOs; enum-checked filters; size limits.
- Image uploads: max 8 MB, JPEG/PNG/WebP only, checked by magic bytes not just
  extension, re-named to random keys, max 20 per listing.
- Rate limits: auth 10/min/IP, enquiries 20/hour/user, visits 10/hour/user, reports
  5/hour/IP. Returns 429.
- Phone number of owner hidden until a logged-in buyer enquires (anti-scraping).
- Verification documents stored with private keys only, never returned by public APIs.
- JPA parameter binding only (no string-built SQL); CORS restricted to configured
  frontend origin; standard security headers; generic error messages for 500s.
- Audit logs for moderation, suspensions, promotions, visit transitions.

## 7. Milestones & status

| # | Milestone | Status |
|---|---|---|
| 1 | Reference analysis & UI direction | UI direction done. Reference review **blocked**: the four sites could not be opened; send screenshots to compare |
| 2 | Architecture, schema, API contracts | Done (this document) |
| 3 | React + Spring Boot + MySQL setup | Done, runs locally against MySQL 8 |
| 4 | Auth & roles | Done (JWT, BCrypt, BUYER/SELLER/ADMIN; BUILDER role reserved) |
| 5 | Listing create/manage, images, moderation | Done with local disk storage; Cloudinary **pending credentials** |
| 6 | Search, cards, detail pages | Done (server-side filters, sort, pagination) |
| 7 | Enquiries, favourites, site visits | Done |
| 8 | Seller dashboard, basic admin tools | Done (moderation, reports, users, manual featuring, audit log) |
| 9 | Featured listings + payments | Manual admin featuring done; payment gateway **not started** |
| 10 | Builder, analytics, services, commission | Not started (builder page is a placeholder) |
| 11 | Hardening, deployment | Not deployed; email/SMS/OTP verification **not started** |

See README for the exact feature checklist and test results.
