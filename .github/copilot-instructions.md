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
| `/consoles` | ConsolesPage |
| `/cart` | CartPage |
| `/profile` | ProfilePage |
| `/orders` | OrderHistoryPage |
| `/login` | LoginPage |
| `/register` | RegisterPage |
| `/seller/dashboard` | SellerDashboardPage (sellerOnly) |
| `/seller/manabox-upload` | ManaboxUploadPage (sellerOnly) |
| `/seller/cards/:id/inventory` | SellerInventoryFormPage (sellerOnly) |
| `/sets` | SetBrowsePage (public) |
| `/wishlist` | WishlistPage (protected) |
| `/admin/orders` | AdminOrdersPage (adminOnly) |
| `/admin/*` | Admin pages (adminOnly) |

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
- `Wishlist` — per-user wishlist (`{ user: ObjectId (unique), cards: ObjectId[] }`)
- `StockNotification` — per-user per-card notify subscription (compound unique index on user+card)

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

## Recent Commit History (as of March 2026)
| Commit | Description |
|---|---|
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
