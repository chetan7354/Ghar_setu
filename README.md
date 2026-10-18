# GharSetu: direct-from-owner property marketplace (Gwalior)

React + TypeScript + Tailwind frontend, Spring Boot 3.5 (Java 21) backend, MySQL 8 with Flyway migrations.
Architecture, schema, API list, user journeys and security notes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

"GharSetu" is a working name. Change it in `frontend/src/brand.ts`, `frontend/src/components/Logo.tsx` and `app.brand-name` in `backend/src/main/resources/application.yml`.

## Feature status (checked on 2026-10-18)

| Feature | Status | How it was checked |
|---|---|---|
| Register / login (buyer, seller), JWT, BCrypt | Working | Backend tests + browser test |
| Role checks enforced in backend (not just hidden buttons) | Working | Tests: buyer can't post, seller can't open admin, other users can't edit/delete/upload |
| Suspended users lose access | Working | Test |
| Post property (multi-step form, type-specific fields) | Working | Browser test |
| Photo upload with real file-type check (JPEG/PNG/WebP, 8 MB, 20 max) | Working, **local disk only** | Test rejects a fake .jpg |
| Cloudinary image storage | **Pending**: needs Cloudinary account + keys | Not built yet |
| Moderation: new/edited listings hidden until admin approves | Working | Tests + browser test |
| Duplicate listing flag for moderators | Working (same owner/phone, locality, type, price ±2%, area ±5%) | Test |
| Search: locality, type, category, price, bedrooms, area, furnishing, possession, featured, verified, text; sort; pagination, all in MySQL | Working | 5 search tests |
| Property detail page, gallery, trust badges | Working | Browser test |
| Owner phone hidden until buyer enquires | Working | Tests + browser test |
| Enquiries + owner replies | Working | Tests + browser test |
| Site visits: request, accept, decline, propose new time, buyer accepts, cancel, complete | Working, audit-logged | Tests + browser test |
| Favourites | Working | Test |
| Report listing (anonymous allowed) + admin resolution | Working | Test |
| Admin: stats, moderation, reports, users, manual featuring, contact-verified flag, audit log | Working | Tests |
| Rate limiting (auth, enquiries, visits, reports) | Working for **one server instance** (in memory) | Unit test |
| Pricing page with featured packages | Working; **no online payment** | Admin features manually |
| Payment gateway, invoices, refunds | **Not started** (Phase 2+) | |
| Email / SMS / WhatsApp notifications | **Not started**, no provider configured | |
| Phone/email OTP verification | **Not started** (needs SMS/email provider) | Admin can mark contact verified manually |
| Ownership document upload for verification | **Not started** (table exists) | |
| Builder dashboard / project pages | **Not started** (placeholder page) | |
| Map | Link to OpenStreetMap when owner gives coordinates; embedded map **not started** | |
| Deployment | **Not done** | |

Test results: `mvn test` ran **27 tests, 0 failures** against a real MySQL 8.0.46 database. A Playwright browser test ran the full journey (seller registers → posts with photo → admin approves → buyer finds it in search → enquires → books visit → seller replies and accepts → buyer sees both) with no browser console errors.

## Run it on Windows (PowerShell)

Install first: **JDK 21**, **Maven 3.9+**, **Node.js 22**, **MySQL 8**.

### 1. Database

```powershell
mysql -u root -p
```
```sql
CREATE DATABASE gharsetu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gharsetu'@'localhost' IDENTIFIED BY 'choose-a-password';
GRANT ALL ON gharsetu.* TO 'gharsetu'@'localhost';
-- only needed to run tests:
CREATE DATABASE gharsetu_test CHARACTER SET utf8mb4;
GRANT ALL ON gharsetu_test.* TO 'gharsetu'@'localhost';
```

Tables are created by Flyway on backend start from `backend/src/main/resources/db/migration` (`V1__core_schema.sql`, `V2__seed_reference_data.sql` with Gwalior localities, amenities and packages). Never edit a migration that has already run; add `V3__...sql` instead.

### 2. Backend

```powershell
cd backend
$env:DB_PASSWORD = "choose-a-password"
$env:JWT_SECRET = "put-a-random-string-of-at-least-32-characters-here"
$env:ADMIN_EMAIL = "you@example.com"
$env:ADMIN_PASSWORD = "a-strong-password-12-plus"
mvn spring-boot:run
```
API runs on http://localhost:8080 (health: http://localhost:8080/actuator/health). The admin account is created on first start from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. All settings are listed in `backend/.env.example`.

Run tests (uses `gharsetu_test`, wipes it each run):
```powershell
$env:TEST_DB_PASSWORD = "choose-a-password"
mvn test
```

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. Vite forwards `/api` and `/uploads` to the backend. If photos don't show in dev, set `$env:PUBLIC_BASE_URL = "http://localhost:5173"` before starting the backend.

Production build: `npm run build` (output in `frontend/dist`). Set `VITE_API_BASE` to the backend URL if it is on another domain, and `CORS_ORIGINS` on the backend to the frontend URL.

## Before going live

- Real support email in `brand.ts`; have a lawyer review Privacy and Terms (marked as drafts).
- Cloudinary keys, an SMS/email provider for OTP, and a payment gateway with webhook verification, each tested end-to-end before being switched on.
- Redis-backed rate limiter if you run more than one backend instance.
- Check Gwalior PIN codes in `V2__seed_reference_data.sql`.
- RERA, invoicing and tax review before any commission feature.
