# Boardgame Time — MTG Singles & Boardgame Café

A full-stack web application for **Boardgame Time**, a boardgame café and MTG singles shop in Indonesia. Customers can browse the card catalog, place orders, and view café info. Sellers manage inventory. Admins have a full dashboard for cards, pricing, orders, TikTok, café settings, and user management.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Roles](#roles)
- [Pricing System](#pricing-system)
- [API Overview](#api-overview)
- [Frontend Routes](#frontend-routes)
- [Deployment](#deployment)

---

## Features

### Storefront (Public)
- Browse & search all cards across all sellers
- Filter by name, set, condition, finish, price range
- Mobile-friendly catalog with bottom navigation (desktop: table view, mobile: feed view)
- Card detail pages with images and per-seller inventory breakdown
- Shopping cart, checkout, order history & order detail page, customer profile
- Customer registration & login
- **Wishlist** — save cards, receive stock-back notifications when OOS cards restock
- **Browse by Set** — navigate the full MTG set list, click into any set's cards
- **Condition guide** — inline NM / LP / P guide on card detail pages
- **Order timeline** — visual stepper (Pending → Processing → Shipped → Delivered) on order detail

### Boardgame Café Page
- Public `/cafe` page with live content managed from the admin panel
- Operating hours (per-day open/closed toggle), entry fee, Mahjong table info
- **Featured game carousel** — boardgames marked as Featured in the DB appear as a horizontally-scrollable card carousel; each card links to its detail page
- Contact links (WhatsApp, Instagram, Google Maps), tagline, and WhatsApp FAB
- All content stored in MongoDB and editable without code changes

### Boardgame Catalogue (`/boardgames`)
- Full searchable, filterable catalogue of boardgames in the café
- Filter by category (Strategy, Party, Family, …) and difficulty (Easy / Medium / Hard / Expert)
- Each game has a dedicated detail page (`/boardgames/:id`) with gallery, how-to-play guide, stats (players, duration, age), designer/publisher info
- Admins manage the full game library at `/admin/boardgames` (CRUD, gallery, featured flag, sort order)

### Admin Panel
- **Card Inventory** — add, edit, soft-delete, bulk CSV import
- **Browse Cards** — sortable table with finish badges (Normal/Foil/Etched), per-finish Web Price & Marketplace price columns
- **Seller management** — create/edit/delete seller accounts, reset passwords
- **Dashboard** — inventory value, order counts, active sellers, recent activity
- **CK price sync** — fetch latest Card Kingdom prices and recalculate all sell prices
- **Bulk price update** — apply multiplier changes across all cards at once
- **Featured banners & carousel** — manage homepage promotional content
- **Set management** — upload set JSON to register new sets
- **Maintenance tools** — fix seller names, regenerate SKUs, fix inventory quantities, fix DFC layouts
- **Missing images** — filter and bulk-assign images to cards without one
- **Membership** — manage customer membership tiers
- **Boardgame Library** — full CRUD for boardgames at `/admin/boardgames` (name, description, gallery, how-to-play, category, difficulty, featured flag, sort order)
- **Boardgame Café CMS** — edit hours, entry fee, Mahjong info, console rental (PS5/Switch) rates & happy-hour, contact links via `/admin/cafe`
- **Danger zone** — separate targeted clear buttons for users, cards, and orders (API keys always preserved)

### Seller Panel
- Manage own inventory slots per card (condition, finish, qty, price)
- Manabox CSV import for bulk inventory upload
- View own assigned orders and sales history
- Profile management

### Order Management
- Customer orders  cart  checkout  order history
- Admin: view/manage all online orders
- **TikTok Shop**  fetch orders via API, assign to sellers, deduct stock
- Saved TikTok orders with seller assignment, undo support, inline stock editing

### Offline Sales (Walk-in)
- Record walk-in sales without an online order
- Card-first search across all sellers currently in stock
- Build a sale cart mixing cards from multiple sellers
- Payment method tracking (Cash / Transfer / Other)
- Sale history with void support

### Offline Buys (Buy-back)
- Record cards purchased from walk-in customers
- Per-item: card name, condition, finish, buy price
- Buy history with void support

### TikTok Shop Integration
- Fetch and manage TikTok Shop orders
- Bulk update product prices & stock via CSV upload (SSE stream with live progress)
- `productId` and `skuId` use `'` prefix to prevent Excel scientific notation; stripped automatically on upload
- `sellerSku` column links CSV rows to the matching inventory slot; after a successful sync the `tiktokProductId` and `tiktokSkuId` are written back to the database
- Failed rows downloadable as **XLSX**  long IDs stay as text, card name special characters are safe

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | HTTP server & API |
| TypeScript | Type safety |
| MongoDB + Mongoose | Database & ODM |
| JWT | Authentication |
| Zod | Request validation |
| express-rate-limit | Auth route brute-force protection |
| Multer | File uploads (images, CSV) |
| csv-parse | CSV parsing |
| Axios | CK price fetching, TikTok API calls |
| crypto | TikTok API signature generation, credential encryption |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| vite-plugin-pwa | Progressive Web App support |
| Tailwind CSS | Styling |
| React Router v6 | Client-side routing |
| Axios | API calls |
| Keyrune (ss-icons) | MTG set symbol icons |
| SheetJS (xlsx) | XLSX export for failed-rows download |

---

## Project Structure

```
Boardgame Time/
 backend/
    src/
       config/
          database.ts        # MongoDB connection
          env.ts             # Environment variable loader
       controllers/           # Business logic per resource
       middleware/
          auth.middleware.ts # JWT verify, requireAdmin, requireSeller
          asyncHandler.ts
          errorHandler.ts
       models/
          Card.model.ts           # Cards with inventory[] sub-documents
          User.model.ts           # Admin, seller, customer accounts
          Order.model.ts          # Online orders
          TikTokOrder.model.ts    # Imported TikTok orders
          TikTokCredentials.model.ts
          OfflineSale.model.ts    # Walk-in sales
          OfflineBuy.model.ts     # Walk-in buy-backs
          Cart.model.ts
          Carousel.model.ts
          FeaturedBanner.model.ts
          FeaturedProduct.model.ts
          UBSettings.model.ts     # UB pricing settings
          RegularSettings.model.ts
          CafeSettings.model.ts   # Boardgame café content (single-document)
       routes/                # One file per resource
       utils/
          regularPricing.ts
          ubPricing.ts
       server.ts
    uploads/images/
    create-admin.js            # Bootstrap first admin
    reset-admin-password.js
    check-sets.js
    check-recent-sets.js
    bulkup.csv                 # TikTok bulk-update CSV example
    tiktok-bulk-update-template.csv
    TIKTOK_CSV_INSTRUCTIONS.md
    package.json

 frontend/
     src/
        api/          # Axios API wrappers per resource
        components/   # Shared UI components
        contexts/     # AuthContext, CartContext, ThemeContext
        pages/        # One file per page/route
        types/        # Shared TypeScript interfaces (Card, InventoryItem, etc.)
        App.tsx       # Route definitions
     package.json
```

---

## Quick Start (New PC / Fresh Setup)

### Step 1 — Install prerequisites

**Node.js 20 LTS** (includes npm):
- Download from https://nodejs.org → choose the **LTS** installer for your OS
- After install, verify: `node -v` and `npm -v`

**MongoDB Community Server**:
- Download from https://www.mongodb.com/try/download/community → choose your OS → MSI (Windows) or pkg (Mac)
- Install with default settings; the installer will register it as a service that starts automatically
- Verify: `mongosh` in a terminal should connect without errors (type `exit` to quit)
- Alternative: use a free cloud database at https://www.mongodb.com/atlas (free tier) — then use the Atlas connection string instead of `mongodb://localhost`

**Git**:
- Download from https://git-scm.com/downloads if not already installed

---

### Step 2 — Clone the repository

```bash
git clone https://github.com/cete1995/Sylvan-Library.git
cd "Sylvan Library"
```

---

### Step 3 — Configure backend environment

Create the file `backend/.env` (this file is git-ignored, you must create it manually):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sylvan-library
JWT_SECRET=change_this_to_a_long_random_string_min_32_chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

> If using MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string, e.g.:
> `MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/sylvan-library`

---

### Step 4 — Install dependencies

Open **two separate terminals** — you need both backend and frontend running at the same time.

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
# → API running at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
# → App running at http://localhost:5173
```

---

### Step 5 — Create the first admin account

With the backend running, open a **third terminal**:

```bash
cd backend
node create-admin.js
```

Follow the prompts (email + password). To reset a password later:
```bash
node reset-admin-password.js
```

---

### Step 6 — Open the app

Go to `http://localhost:5173/login` and sign in with the admin credentials you just created.

---

### Troubleshooting

| Problem | Fix |
|---|---|
| `EADDRINUSE: port 5000` | Another process is using port 5000. Change `PORT=5001` in `backend/.env` and update `VITE_API_URL` in `frontend/.env` |
| `MongooseServerSelectionError` | MongoDB is not running. On Windows: open Services → start **MongoDB**. On Mac: `brew services start mongodb-community` |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, then retry |
| Frontend shows blank page | Check browser console. Usually a missing `backend/.env` or backend not started |
| `Cannot find module` on backend | Run `npm run build` once, or ensure `ts-node` / `tsx` is installed via `npm install` |

---

## Environment Variables

### `backend/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `MONGODB_URI` | Yes |  | MongoDB connection string |
| `JWT_SECRET` | Yes |  | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | No | `7d` | Token lifetime |
| `FRONTEND_URL` | Yes |  | CORS origin (e.g. `http://localhost:5173`) |

### `frontend/.env` (optional)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Override API base URL |

---

## Roles

| Role | Access |
|---|---|
| **Admin** | Full access  all pages, all sellers' data, pricing, TikTok, offline sales |
| **Seller** | Own inventory, Manabox import, own orders, profile |
| **Customer** | Storefront, cart, checkout, order history, profile |
| **Public** | Storefront browsing only |

---

## Pricing System

```
Sell Price = CK Price  Multiplier
```

- **UB Sets**  Universes Beyond / special treatment; Admin  UB Pricing / UB Settings
- **Regular Sets**  all other sets; Admin  Regular Settings
- Prices recomputed on "Sync All Prices" (Admin  Prices) or per-card edit
- **Buy price**  set manually per inventory slot
- **Marketplace price**  TikTok/Tokopedia price (with platform fee); tracked per inventory slot alongside `tiktokProductId`, `tiktokSkuId`, and `sellerSku`

---

## API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/register` | Register customer account |
| GET | `/api/auth/me` | Get current user |

### Public
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cards` | Search/filter cards |
| GET | `/api/cards/:id` | Card details |
| GET | `/api/cart` | Get cart |
| POST | `/api/cart/items` | Add to cart |
| POST | `/api/orders` | Place order |
| GET | `/api/orders/history` | Customer order history |
| GET | `/api/public/carousel` | Active carousel items |
| GET | `/api/public/featured` | Featured banners & products |
| GET | `/api/cafe/settings` | Boardgame café content |

### Admin (JWT + admin role)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard stats |
| GET/POST/PUT/DELETE | `/api/admin/cards` | Card management |
| POST | `/api/admin/cards/bulk-upload` | CSV card import |
| GET/POST/DELETE | `/api/admin/sellers` | Seller accounts |
| GET/POST | `/api/admin/offline-sales` | Walk-in sale records |
| POST | `/api/admin/offline-sales/:id/void` | Void a walk-in sale |
| GET/POST | `/api/admin/offline-buys` | Walk-in buy records |
| GET/PUT | `/api/admin/ub-pricing` | UB pricing settings |
| GET/PUT | `/api/admin/ub-settings` | UB set list |
| GET/PUT | `/api/admin/regular-pricing` | Regular pricing settings |
| POST | `/api/admin/sync-prices` | Recalculate all prices from CK |
| GET/POST/PUT/DELETE | `/api/admin/carousel` | Carousel management |
| GET/POST/PUT/DELETE | `/api/admin/featured` | Featured content |
| PUT | `/api/admin/cafe/settings` | Update boardgame café content |
| POST | `/api/admin/clear-users` | Delete customer accounts & carts |
| POST | `/api/admin/clear-cards` | Delete all cards and featured content |
| POST | `/api/admin/clear-orders` | Delete all orders and carts |
| POST | `/api/tiktok/bulk-update-csv-stream` | Bulk price+stock update (SSE) |
| POST | `/api/tiktok/bulk-update-csv` | Bulk price+stock update (legacy) |

### Seller (JWT + seller role)
| Method | Endpoint | Description |
|---|---|---|
| GET/POST/PUT | `/api/seller/inventory` | Own inventory |
| GET | `/api/seller/orders` | Own assigned orders |
| POST | `/api/manabox/upload` | Manabox CSV import |

---

## Frontend Routes

### Public
| Path | Description |
|---|---|
| `/` | Home |
| `/catalog` | Card catalog |
| `/cards/:id` | Card detail |
| `/sets` | Browse by MTG set |
| `/cafe` | Boardgame Café & Mahjong info |
| `/boardgames` | Boardgame catalogue |
| `/boardgames/:id` | Boardgame detail page |
| `/consoles` | Console rental info (PS5 / Switch) |
| `/login` | Login (admin / seller / customer) |
| `/register` | Customer registration |
| `/cart` | Shopping cart |
| `/orders` | Order history (requires login) |
| `/orders/:id` | Order detail (requires login) |
| `/profile` | Profile (requires login) |
| `/wishlist` | Wishlist (requires login) |

### Admin
| Path | Description |
|---|---|
| `/admin/dashboard` | Dashboard overview |
| `/admin/cards` | Browse & manage card inventory |
| `/admin/cards/new` | Add new card |
| `/admin/cards/edit/:id` | Edit card |
| `/admin/bulk-upload` | Bulk CSV import |
| `/admin/set-upload` | Upload set JSON |
| `/admin/missing-images` | Cards without images |
| `/admin/sellers` | Seller management |
| `/admin/prices` | Price management & CK sync |
| `/admin/ub-pricing` | UB pricing multiplier |
| `/admin/ub-settings` | UB set list |
| `/admin/regular-settings` | Regular pricing settings |
| `/admin/carousel` | Carousel management |
| `/admin/featured` | Featured banners & products |
| `/admin/orders` | All online orders (paginated, bulk status update) |
| `/admin/offline-sales` | Walk-in sales |
| `/admin/offline-buys` | Walk-in buy-backs |
| `/admin/tiktok-debug` | TikTok bulk update & debug |
| `/admin/tiktok-get-orders` | Fetch TikTok orders |
| `/admin/tiktok-orders` | TikTok order list |
| `/admin/tiktok-saved-orders` | Saved/assigned TikTok orders |
| `/admin/tiktok-orders/:orderId` | TikTok order detail |
| `/admin/membership` | Customer membership |
| `/admin/debug` | System maintenance tools |
| `/admin/cafe` | Boardgame Café content editor (hours, consoles, entry fee) |
| `/admin/boardgames` | Boardgame library CRUD |

### Seller
| Path | Description |
|---|---|
| `/seller/dashboard` | Seller dashboard & inventory |
| `/seller/cards/:id/inventory` | Edit inventory for a card |
| `/seller/manabox-upload` | Manabox CSV import |

---

## Deployment

| Platform | Service | Notes |
|---|---|---|
| **Vercel** | Frontend | Root Directory: `/frontend`; auto-deploys on push to `main` |
| **Railway** | Backend | Auto-deploys on push to `main` |

**Live URLs:**
- Frontend: https://sylvanlibraryfe.vercel.app
- Backend: https://sylvan-library-production.up.railway.app
- GitHub: https://github.com/cete1995/Sylvan-Library (branch: `main`)

```bash
# Backend
cd backend && npm run build && npm start

# Frontend (output in frontend/dist/)
cd frontend && npm run build
# Serve dist/ via Nginx, Vercel, or Netlify
```

---

## Acknowledgments

- Card data & images  [Scryfall](https://scryfall.com)
- Pricing reference  [Card Kingdom](https://www.cardkingdom.com)
- Set symbol icons  [Keyrune](https://keyrune.andrewgioia.com/)
- Magic: The Gathering is a trademark of Wizards of the Coast LLC

---

*Made with love for the MTG community*
