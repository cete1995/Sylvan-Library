# Sylvan Library — MTG Inventory & Store

A full-stack web application for managing Magic: The Gathering card inventory across multiple sellers, with a public storefront, TikTok order management, offline sales recording, and automated pricing.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Roles](#roles)
- [Pricing System](#pricing-system)
- [Deployment](#deployment)

---

## Features

### 🛍️ Public Storefront
- Browse & search all cards across all sellers
- Filter by name, set, condition, finish, price range
- Mobile-friendly catalog with bottom navigation
- Card detail pages with images and inventory breakdown
- Shopping cart with checkout flow
- Order tracking

### 🔐 Admin Panel
- Full card & inventory management (add, edit, delete, bulk CSV upload)
- Seller account management (create, edit, reset password, delete stock)
- Dashboard stats (inventory value, order counts, seller breakdown)
- Price sync from CK data — calculates sell prices via pricing tiers
- Bulk price update across all cards
- Featured banners & carousel management
- Set management (upload set JSON for new sets)
- Maintenance tools (fix seller names, regenerate SKUs, fix inventory quantities)

### 👤 Seller Panel
- Each seller manages their own inventory slots per card
- View their own orders and sales history
- Profile management

### 📦 Order Management
- Customer orders (cart → checkout → order history)
- Admin can view/manage all orders
- TikTok order import & assignment to sellers
- Saved TikTok orders with seller assignment, stock deduction, undo support
- Edit stock quantities directly from the TikTok order panel

### 🏬 Offline Sales (Walk-in)
- Record walk-in sales without an online order
- **Card-first search** — search any card name across all sellers in stock
- Each result shows which sellers have it, condition, finish, stock, and live price
- Build a sale cart mixing cards from multiple sellers
- Payment method tracking (Cash / Transfer / Other)
- Sale history with per-item seller breakdown and void support

### 🏷️ Pricing System
- Two pricing tiers: **UB Sets** and **Regular Sets**
- Prices calculated as: `CK Price × multiplier` (configured per tier)
- Buy price tracked separately per inventory slot
- Marketplace price (TikTok/external platform) tracked separately

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
| Multer | File uploads (images, CSV) |
| Axios | CK price fetching |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| React Router v6 | Client-side routing |
| Axios | API calls |
| Recharts | Analytics charts |
| TanStack Query | Server state management |

---

## Project Structure

```
Sylvan Library/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, env vars
│   │   ├── controllers/     # Business logic per resource
│   │   ├── middleware/       # Auth, error handling, async wrapper
│   │   ├── models/          # Mongoose schemas
│   │   │   ├── Card.model.ts
│   │   │   ├── User.model.ts
│   │   │   ├── Order.model.ts
│   │   │   ├── TikTokOrder.model.ts
│   │   │   ├── OfflineSale.model.ts
│   │   │   ├── Cart.model.ts
│   │   │   ├── Carousel.model.ts
│   │   │   ├── FeaturedBanner.model.ts
│   │   │   ├── FeaturedProduct.model.ts
│   │   │   ├── UBSettings.model.ts
│   │   │   └── RegularSettings.model.ts
│   │   ├── routes/          # Route definitions
│   │   ├── utils/           # Pricing calculators, auth helpers
│   │   └── server.ts        # Entry point
│   ├── uploads/images/      # Uploaded card images
│   ├── create-admin.js      # Script to bootstrap first admin
│   ├── reset-admin-password.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/             # Axios API wrappers per resource
    │   ├── components/      # Shared UI components
    │   ├── contexts/        # Auth context, cart context
    │   ├── pages/           # One file per page/route
    │   │   ├── AdminDashboardPage.tsx
    │   │   ├── AdminCardListPage.tsx
    │   │   ├── AdminOfflineSalePage.tsx
    │   │   ├── AdminTikTokSavedOrdersPage.tsx
    │   │   └── ...
    │   ├── types/           # Shared TypeScript interfaces
    │   └── App.tsx          # Routes
    └── package.json
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a connection string)
- npm

### 1. Clone the repo

```bash
git clone https://github.com/cete1995/Sylvan-Library.git
cd "Sylvan Library"
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sylvan-library
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

Start the dev server:
```bash
npm run dev
```
→ API runs at `http://localhost:5000`

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```
→ App runs at `http://localhost:5173`

### 4. Create the first admin account

```bash
cd backend
node create-admin.js
```

Follow the prompts to set email and password.

### 5. Login

Go to `http://localhost:5173/admin/login` and sign in.

---

## Environment Variables

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `5000`) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret key for signing tokens |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `7d`) |
| `FRONTEND_URL` | ✅ | Used for CORS (e.g. `http://localhost:5173`) |

### `frontend/.env` (optional)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Override API base URL (default: `http://localhost:5000/api`) |

---

## API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Public
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cards` | Search/filter cards |
| GET | `/api/cards/:id` | Card details |
| GET | `/api/cart` | Get cart |
| POST | `/api/orders` | Place order |

### Admin (JWT required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard stats |
| GET/POST/PUT/DELETE | `/api/admin/cards` | Card management |
| POST | `/api/admin/cards/bulk-upload` | CSV import |
| GET/POST/DELETE | `/api/admin/sellers` | Seller accounts |
| GET/POST | `/api/admin/offline-sales` | Walk-in sales |
| GET/POST | `/api/admin/tiktok/*` | TikTok order management |
| GET/PUT | `/api/admin/ub-pricing` | UB set pricing settings |
| GET/PUT | `/api/admin/regular-pricing` | Regular set pricing settings |
| POST | `/api/admin/sync-prices` | Recalculate all sell prices from CK |

### Seller (JWT required)
| Method | Endpoint | Description |
|---|---|---|
| GET/POST/PUT | `/api/seller/inventory` | Manage own inventory |
| GET | `/api/seller/orders` | View own orders |

---

## Roles

| Role | Access |
|---|---|
| **Admin** | Full access — all pages, all sellers' data, pricing, settings |
| **Seller** | Own inventory management, own orders view |
| **Public** | Storefront browsing, cart, checkout |

---

## Pricing System

Sell prices are calculated automatically:

```
Sell Price = CK Price × Multiplier
```

- **UB Sets** — sets with the UB (Universes Beyond) or non-Standard treatment; configured via Admin → UB Pricing
- **Regular Sets** — all other sets; configured via Admin → Regular Pricing
- Prices are recomputed on **"Sync All Prices"** or per-card edit
- Buy prices are set manually per inventory slot

---

## Deployment

See the full guide in [`backend/README.md`](backend/README.md) or deploy to:

| Platform | Notes |
|---|---|
| **DigitalOcean Droplet** | Recommended — $4/mo, Singapore region, low latency for ID |
| **Railway.app** | Free tier, zero-config Node.js deploy |
| **VPS (any provider)** | Requires Node.js 20, MongoDB, Nginx, PM2 |

### Production build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# Serve frontend/dist/ via Nginx or any static host (Vercel, Netlify)
```

---

## Acknowledgments

- Card data & images — [Scryfall](https://scryfall.com)
- Pricing reference — Card Kingdom (CK)
- Inspired by [BinderPOS](https://www.binderpos.com)
- Magic: The Gathering is a trademark of Wizards of the Coast LLC

---

*Made with ❤️ for the MTG community*


## Features

### Public Storefront
- **Card Catalog**: Browse and search MTG cards with powerful filters
- **Advanced Search**: Filter by name, set, rarity, color identity, price range
- **Card Details**: View complete card information with images
- **Responsive Design**: Works on desktop, tablet, and mobile

### Admin Dashboard
- **Inventory Management**: Add, edit, and delete cards
- **Bulk Upload**: Import cards via CSV file
- **Price Management**: Set buy and sell prices
- **Statistics**: Track inventory value and sales metrics
- **Quantity Tracking**: Manage owned vs. for-sale quantities
- **Soft Delete**: Archive cards without losing data

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- MongoDB with Mongoose ODM
- JWT authentication
- Zod validation
- RESTful API

### Frontend
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS
- React Router
- Axios

## Project Structure

```
Sylvan Library/
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── config/      # Database and environment config
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Auth, validation, error handling
│   │   ├── models/      # Mongoose schemas
│   │   ├── routes/      # API routes
│   │   ├── utils/       # Helper functions
│   │   ├── validators/  # Zod schemas
│   │   └── server.ts    # Entry point
│   ├── package.json
│   └── README.md
│
└── frontend/             # React application
    ├── src/
    │   ├── api/         # API client
    │   ├── components/  # Reusable components
    │   ├── contexts/    # React contexts
    │   ├── pages/       # Page components
    │   ├── types/       # TypeScript types
    │   └── App.tsx      # Main component
    ├── package.json
    └── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or connection string)
- npm

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd "Sylvan Library"
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Create Admin User

Use a tool like Postman or curl:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"SecurePass123\"}"
```

### 5. Login

- Go to `http://localhost:5173/admin/login`
- Login with your credentials
- Start adding cards!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register admin user
- `POST /api/auth/login` - Login and get JWT
- `GET /api/auth/me` - Get current user

### Public Cards
- `GET /api/cards` - Search and filter cards
- `GET /api/cards/:id` - Get card details
- `GET /api/cards/sets/list` - Get available sets

### Admin (Requires JWT)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/cards` - List all cards (admin view)
- `POST /api/admin/cards` - Create card
- `PUT /api/admin/cards/:id` - Update card
- `DELETE /api/admin/cards/:id` - Delete card (soft)
- `POST /api/admin/cards/bulk-upload` - Bulk CSV upload

## Data Models

### Card
```typescript
{
  name: string
  setCode: string
  setName: string
  collectorNumber: string
  language: string (default: "EN")
  condition: "NM" | "SP" | "MP" | "HP" | "DMG"
  finish: "nonfoil" | "foil" | "etched"
  quantityOwned: number
  quantityForSale: number
  buyPrice: number
  sellPrice: number
  rarity: "common" | "uncommon" | "rare" | "mythic"
  colorIdentity: string[] // ["W", "U", "B", "R", "G"]
  imageUrl?: string
  scryfallId?: string
  typeLine?: string
  oracleText?: string
  manaCost?: string
  notes?: string
  isActive: boolean
}
```

### User
```typescript
{
  email: string
  passwordHash: string
  role: "admin"
}
```

## Bulk Upload CSV Format

Download template from admin panel or use this format:

```csv
name,setCode,setName,collectorNumber,language,condition,finish,quantityOwned,quantityForSale,buyPrice,sellPrice,rarity,colorIdentity
"Lightning Bolt",LEA,"Limited Edition Alpha",161,EN,NM,nonfoil,4,2,150.00,200.00,common,R
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Auto-reload with nodemon
```

### Frontend Development
```bash
cd frontend
npm run dev  # Hot module reload with Vite
```

### Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mtg-inventory
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env) - Optional
```
VITE_API_URL=http://localhost:5000/api
```

## Features Roadmap

- [ ] Shopping cart and checkout
- [ ] Customer accounts
- [ ] Order history
- [ ] Scryfall API integration for auto-fill
- [ ] Card price tracking
- [ ] Sales analytics
- [ ] Export reports
- [ ] Multi-language support
- [ ] Dark mode

## Contributing

This is a personal project, but suggestions and contributions are welcome!

## License

ISC

## Acknowledgments

- Inspired by BinderPOS
- Magic: The Gathering is a trademark of Wizards of the Coast LLC
- Card data and images courtesy of Scryfall

---

**Made with ❤️ for the MTG community**
