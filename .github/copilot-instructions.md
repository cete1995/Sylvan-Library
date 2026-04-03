# Boardgame Time — Copilot Context

## What This Project Is
A full-stack web app for **Boardgame Time**, a boardgame café + MTG singles shop in Indonesia.
- Customers can browse the MTG card catalog, add to cart, place orders, view order history, wishlist cards (with stock notifications), rent consoles, and see café info.
- Sellers can manage inventory (add stock to existing cards) and upload collections via Manabox CSV.
- Admins have a full dashboard for cards, pricing, orders (bulk status updates), carousel, featured products, café settings, TikTok orders, sales analytics, low-stock alerts, and user management.

## Monorepo Structure
```
/backend    — Node.js + Express + TypeScript + MongoDB (Mongoose)
/frontend   — React + TypeScript + Vite + Tailwind CSS
```

## Deployment
- **Frontend:** Vercel — https://sylvanlibraryfe.vercel.app (Root Directory: `/frontend`)
- **Backend:** Railway — https://sylvan-library-production.up.railway.app
- **GitHub:** https://github.com/cete1995/Sylvan-Library (branch: `main`)
- Vercel auto-deploys on push to `main`. Railway auto-deploys on push to `main`.

## Brand & Styling

### Customer pages
- Background gradient: `linear-gradient(135deg, #060918, #0d1440, #111e55)`
- Accent: `#E31E24` (red)
- Secondary: `#1B3A8A` (navy)
- CSS variables: `--color-accent: #E31E24`, `--color-highlight: #1B3A8A`
- Light text on dark bg: `#fca5a5` (light red)
- Amber accent: `#fbbf24`
- CSS variables: `var(--color-background)`, `var(--color-panel)`, `var(--color-text)`, `var(--color-text-secondary)`, `var(--color-accent)`, `var(--color-border)`

### Seller pages
- Background gradient: `linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95)` (purple)
- Accent: `#a78bfa`

### Admin pages
- Keep existing style (dark theme with CSS variables)

## Mobile / iPhone
- `viewport-fit=cover` is set in `index.html`
- `BottomNav` has `paddingBottom: env(safe-area-inset-bottom)` for iPhone home bar
- All customer pages use `pb-28 md:pb-0` for bottom nav clearance
- Seller pages use `pb-28 md:pb-8`

## BottomNav
- Regular users: Home `/` · Browse `/catalog` · Café `/cafe` · Cart `/cart` · Profile `/profile`
- Seller accounts (`user.role === 'seller'`): Home · Browse · **Seller `/seller/dashboard`** (purple, `#a78bfa`) · Café · Profile
- `md:hidden` — only shows on mobile
- Active indicator: colored top bar stripe

## Routes (frontend)
| Path | Page |
|---|---|
| `/` | HomePage |
| `/catalog` | CatalogPage |
| `/cafe` | CafePage |
| `/boardgames` | BoardgameCataloguePage (public) |
| `/boardgames/:id` | BoardgameDetailPage (public) |
| `/consoles` | ConsolesPage |
| `/cart` | CartPage |
| `/profile` | ProfilePage |
| `/orders` | OrderHistoryPage |
| `/orders/:id` | OrderDetailPage |
| `/login` | LoginPage |
| `/register` | RegisterPage |
| `/seller/dashboard` | SellerDashboardPage (sellerOnly) |
| `/seller/manabox-upload` | ManaboxUploadPage (sellerOnly) |
| `/seller/cards/:id/inventory` | SellerInventoryFormPage (sellerOnly) |
| `/sets` | SetBrowsePage (public) |
| `/wishlist` | WishlistPage (protected) |
| `/admin/dashboard` | AdminDashboardPage (adminOnly) |
| `/admin/orders` | AdminOrdersPage (adminOnly) |
| `/admin/offline-sales` | AdminOfflineSalePage (adminOnly) |
| `/admin/offline-buys` | AdminOfflineBuyPage (adminOnly) |
| `/admin/tiktok-debug` | AdminTikTokDebugPage (adminOnly) |
| `/admin/tiktok-get-orders` | AdminTikTokGetOrdersPage (adminOnly) |
| `/admin/tiktok-orders` | AdminTikTokOrdersPage (adminOnly) |
| `/admin/tiktok-saved-orders` | AdminTikTokSavedOrdersPage (adminOnly) |
| `/admin/boardgames` | AdminBoardgamesPage (adminOnly) |
| `/admin/cafe` | AdminCafePage (adminOnly) |
| `/admin/*` | Other admin pages (adminOnly) |

## Key Frontend Files
- `src/App.tsx` — all routes, providers
- `src/components/BottomNav.tsx` — mobile nav
- `src/components/Navbar.tsx` — desktop nav
- `src/contexts/AuthContext.tsx` — auth state, `user.role` ('user' | 'seller' | 'admin')
- `src/contexts/CartContext.tsx` — cart state
- `src/api/` — one file per backend resource (auth, cards, cart, order, café, etc.)
- `src/pages/` — all page components

## Key Backend Files
- `src/server.ts` — Express app, routes, CORS
- `src/config/database.ts` — MongoDB connection
- `src/models/` — Mongoose models
- `src/controllers/` — business logic
- `src/routes/` — route definitions
- `src/utils/regularPricing.ts` + `ubPricing.ts` — pricing calculation

## Backend Models
- `Card` — MTG card (name, setCode, collectorNumber, rarity, imageUrl, inventory[])
- `User` — auth (email, password hash, role: user/seller/admin)
- `Order` — customer order
- `Cart` — per-user cart
- `RegularSettings` — regular pricing config
- `UBSettings` — UB pricing config
- `Carousel` — homepage carousel images
- `FeaturedProduct` / `FeaturedBanner` — homepage featured section
- `TikTokOrder` — TikTok shop orders
- `TikTokCredentials` — encrypted TikTok API credentials (AES-256-CBC, single document)
- `Wishlist` — per-user wishlist (`{ user: ObjectId (unique), cards: ObjectId[] }`)
- `StockNotification` — per-user per-card notify subscription (compound unique index on user+card)
- `OfflineSale` — walk-in sale record (card-first, multi-seller cart, payment method)
- `OfflineBuy` — walk-in buy-back record (per-item: card name, condition, finish, buy price)
- `CafeSettings` — single-document boardgame café CMS (hours, entry fee, Mahjong, consoles)
- `Boardgame` — boardgame library entry (name, description, gallery[], howToPlay, category, difficulty, featured, sortOrder)

## Café Settings (admin-managed)
Stored in DB via `/api/admin/cafe`. Structure:
```ts
{
  whatsapp: string,           // WhatsApp booking link
  boardgamePricing: [...],    // day-type pricing tiers
  mahjong: { pricing: [...] },
  ps5: { enabled, name, hourlyRate, happyHourStart, happyHourRate, happyHourNote, desc },
  nintendoSwitch: { same as ps5 }
}
```
**Note:** `ps5.enabled` / `nintendoSwitch.enabled` flags are ignored on the public ConsolesPage — both consoles always display since console rental is live.

- CartPage has inline checkout modal (address, phone, payment method, courier notes) — calls `orderApi.createOrder`, clears cart server-side via `Cart.findOneAndUpdate`, redirects to `/orders` on success; pre-fills address/phone from saved profile
- CartPage redirect for unauthenticated users goes to `/login` (not `/register`)
- `CartContext.refreshCart()` is called on mount/auth change so cart badge is always correct
- `ProtectedRoute` with `sellerOnly={true}` allows both `seller` and `admin` roles (admins can access seller routes)
- `App.tsx` initialises `isMobile` synchronously (`useState(() => window.innerWidth < 768)`) to avoid flash on `/catalog`
- `ManaboxUploadPage` uses the configured `api` client (not raw axios) — critical for production URL resolution

## Common Patterns
- All async route handlers wrapped in `asyncHandler` middleware
- Auth via JWT in `Authorization: Bearer <token>` header
- `ProtectedRoute` component wraps admin/seller routes
- Images stored in `backend/uploads/images/`
- Manabox CSV upload at `POST /api/manabox/upload`
- Rate limiting (10 req/15min) on `POST /api/auth/login` and `POST /api/auth/register/customer`
- `POST /api/auth/register` is **admin-protected** (`authenticate + requireAdmin`)
- `POST /api/auth/logout` invalidates refresh token in DB (requires auth)
- Order creation (`POST /api/orders`) verifies prices server-side and deducts `quantityForSale`
- Wishlist API at `/api/wishlist` — GET/POST/DELETE for wishlist items; GET/POST/DELETE `/api/wishlist/stock-notify/:cardId` for stock notifications (all routes require `authenticate`)
- Admin orders API: `GET /api/admin/orders` (paginated, status/paymentStatus filters), `POST /api/admin/orders/bulk-status` (bulk status update)
- Admin stats (`GET /api/admin/stats`) returns `totalOrders, totalRevenue, pendingOrders, unpaidOrders, lowStockCards[]`
- All 20+ admin/seller pages use `React.lazy()` with a `<Suspense>` `PageLoader` fallback in App.tsx
- CatalogPage uses 500ms debounced search (searchDebounceRef) and skeleton card grid while loading
- CardCard shows a Quick Add NM button (desktop only, `hidden md:flex`) when NM non-foil stock > 0
- CardDetailPage has inline `ConditionGuideModal` (NM/LP/P guide) and stock-notify subscribe button for OOS cards
- OrderDetailPage shows a status timeline stepper (Pending→Processing→Shipped→Delivered)
- WhatsApp FAB on CafePage links to `https://wa.me/6281333667147`
- PWA configured via `vite-plugin-pwa` in `vite.config.ts`; icons needed: `/pwa-192x192.png`, `/pwa-512x512.png`
- `UserProfile.role` in `frontend/src/api/profile.ts` is `'admin' | 'customer' | 'seller'`

## Known Pitfalls
- **Never use PowerShell `Get-Content`/`Set-Content` on TSX files** — it corrupts UTF-8 emojis/symbols (double-encodes as Windows-1252). Always use Node.js `fs.readFileSync/writeFileSync` with `'utf8'` encoding for file operations.
- When trimming/replacing file content use Node.js scripts, not PowerShell text cmdlets.
- Vercel build fails silently if TypeScript errors exist — always run `npx tsc --noEmit` before pushing.
- TikTok `access_token_expire_in` is a **Unix timestamp** (seconds since epoch), not a duration — compute remaining time as `(expireIn - Date.now()/1000)`, not `expireIn / 3600`.
- TikTok Shop long-lived access tokens are valid for ~1 year; "invalid token" errors during batch retries are usually rate-limiting, not real expiry.
- The TikTok bulk-update retry (`handleRetryFailedRows`) auto-refreshes the token before each retry batch — uses a local variable `activeAccessToken` (not the React state) because state updates are async.
- `sellerSku` must flow through the entire failed-rows pipeline: `originalCsvData` → `failedRows` → retry CSV → retry `originalCsvData`. All types include `sellerSku?: string`.

## TikTok Shop Integration Details
- Credentials stored encrypted (AES-256-CBC) in MongoDB `TikTokCredentials` collection + cached in `localStorage`; DB is the source of truth, loaded on page mount.
- Bulk update flow: frontend uploads CSV → `POST /api/admin/tiktok/bulk-update-csv-stream` → backend parses CSV, groups by `productId`, sends CONCURRENCY=10 concurrent batches with 2s delay between batches → SSE stream back → on success writes `tiktokProductId`/`tiktokSkuId` back to DB via `sellerSku` match.
- `sellerSku` column in CSV links each row to `card.inventory[].sellerSku` — required for DB write-back of TikTok IDs.
- Failed rows: tracked in `failedRows` state, downloadable as CSV with all columns including `sellerSku`. Retry rebuilds CSV with `sellerSku` intact.
- Token refresh: `POST /api/admin/tiktok/refresh-token` → calls TikTok auth endpoint → auto-saves to DB → returns `accessToken`, `refreshToken`, `accessTokenExpireIn` (Unix timestamp), `sellerName`.
- Auto-refresh runs at the start of every retry batch; new token captured in local var `activeAccessToken` for immediate use in `formData.append`.
- `productId`/`skuId` in download CSV prefixed with `\t` to prevent Excel scientific notation.

## Offline Sales & Buy-backs
- Walk-in sale: Admin → `/admin/offline-sales` — card-first search across all sellers' in-stock inventory, build mixed-seller cart, record payment method (Cash/Transfer/Other), void support.
- Walk-in buy-back: Admin → `/admin/offline-buys` — record cards purchased from walk-in customers, per-item buy price, buy history with void support.
- Both deduct/update `quantityForSale` on the Card inventory document.

## Boardgame Catalogue
- Public `/boardgames` — searchable, filterable by category (Strategy/Party/Family/…) and difficulty (Easy/Medium/Hard/Expert).
- Each game: `/boardgames/:id` — gallery, how-to-play, stats (players, duration, age), designer/publisher.
- Admin manages at `/admin/boardgames` — full CRUD, gallery images, featured flag (appears on CafePage carousel), sort order.
- `Boardgame` model fields: `name, description, gallery[], howToPlay, category, difficulty, featured, sortOrder, players, duration, ageRating, designer, publisher, isActive`.

## Recent Commit History (as of March 2026)
| Commit | Description |
|---|---|
| `45d0ee9` | docs: update all READMEs with full new-PC setup steps, fix corrupted code fences |
| `c2f4856` | fix: TikTok token expiry display — was showing Unix timestamp as hours, now shows remaining days/hours |
| `0a358e1` | fix: auto-refresh TikTok token before retry to avoid expired token errors |
| `9acade5` | fix: sellerSku preserved through failed-rows pipeline + 2s retry delay for TikTok rate limit |
| `35e9fda` | fix: boardgames catalogue + detail page, admin boardgames CRUD, CafePage featured-games carousel |
| `0fe806c` | fix: 8 bugs audit 3 — cart cleared after order, checkout pre-fill, isMobile flash, null guards, blob URL leak, admin seller access, remove dead getAllOrders |
| `1c36d3c` | fix: 15 buyer/seller/admin bugs (audit 2) — checkout modal, cartCount badge, ManaboxUploadPage prod URL, CardDetailPage auto-tab, SellerDashboard race, scroll restore, URLSearchParams, indeterminate checkbox, wishlist 401 |
| `d24c0ec` | fix: 11 bugs (audit 1) — auth role, bulkUpdate validation, models barrel, ConditionGuideModal scope, AuthContext leak, order rollback |
| `bb78357` | feat: 14 improvements — wishlist, analytics, lazy loading, skeleton, debounce, conditions guide, order timeline, bulk orders, sets browse |
| `53b0c22` | Security & UX audit: 16-item batch fix (auth, orders, stock, rate-limit, PWA, toasts, WA FAB) |
| `3bac93a` | Session auto-logout (1hr idle) + Remember Me bypass |
| `ec0bc5b` | Console rental always visible, remove Coming Soon fallback |
| `ab0bf72` | Change password for all user roles (user/seller/admin) |
| `6d7cd2f` | Full rebrand to Boardgame Time (red #E31E24 + navy #1B3A8A color scheme) |
| `0e94b3f` | iPhone safe area + bottom nav clearance on all pages |
| `5f1c2fd` | Fix emoji encoding corruption in seller pages |
| `288fe4e` | Fix duplicate content causing TS build failure |
| `174cedf` | Seller mobile access (BottomNav + seller page rewrites) |
| `40d0823` | ConsolesPage + CafePage/HomePage/ProfilePage updates |
