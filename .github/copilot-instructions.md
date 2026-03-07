# Sylvan Library — Copilot Context

## What This Project Is
A full-stack web app for **Sylvan Library**, a boardgame café + MTG singles shop in Indonesia.
- Customers can browse the MTG card catalog, add to cart, place orders, view order history, rent consoles, and see café info.
- Sellers can manage inventory (add stock to existing cards) and upload collections via Manabox CSV.
- Admins have a full dashboard for cards, pricing, orders, carousel, featured products, café settings, TikTok orders, and user management.

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
- Background gradient: `linear-gradient(135deg, #0d2818, #1a3d1a, #14391f)`
- Accent: `#86efac` (green)
- Amber highlight: `#fbbf24`
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

## Known Pitfalls
- **Never use PowerShell `Get-Content`/`Set-Content` on TSX files** — it corrupts UTF-8 emojis/symbols (double-encodes as Windows-1252). Always use Node.js `fs.readFileSync/writeFileSync` with `'utf8'` encoding for file operations.
- When trimming/replacing file content use Node.js scripts, not PowerShell text cmdlets.
- Vercel build fails silently if TypeScript errors exist — always run `npx tsc --noEmit` before pushing.

## Recent Commit History (as of March 2026)
| Commit | Description |
|---|---|
| `ec0bc5b` | Console rental always visible, remove Coming Soon fallback |
| `0e94b3f` | iPhone safe area + bottom nav clearance on all pages |
| `5f1c2fd` | Fix emoji encoding corruption in seller pages |
| `288fe4e` | Fix duplicate content causing TS build failure |
| `174cedf` | Seller mobile access (BottomNav + seller page rewrites) |
| `40d0823` | ConsolesPage + CafePage/HomePage/ProfilePage updates |
| `5577f5e` | Customer-facing page redesigns |
| `bf0363d` | Day-based café pricing + PS5/Switch hourly with happy hour |
