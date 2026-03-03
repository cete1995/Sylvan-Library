# Sylvan Library - Backend

Express + TypeScript API server for the Sylvan Library MTG Inventory system.

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally or a remote connection string

### Install and run

`ash
cd backend
npm install
`

Create ackend/.env (see Environment Variables below), then:

`ash
npm run dev     # development with auto-reload
npm run build   # compile TypeScript
npm start       # run compiled output
`

API runs at http://localhost:5000.

---

## Environment Variables

Create a .env file in the ackend/ directory:

`env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sylvan-library
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
`

| Variable | Required | Default | Description |
|---|---|---|---|
| PORT | No | 5000 | Server port |
| NODE_ENV | No | development | development or production |
| MONGODB_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | Yes | - | Secret for JWT signing |
| JWT_EXPIRES_IN | No | 7d | Token lifetime |
| FRONTEND_URL | Yes | - | CORS origin |

---

## Creating an Admin Account

`ash
node create-admin.js
`

Follow the prompts. To reset a password later:

`ash
node reset-admin-password.js
`

---

## Project Structure

`
backend/
src/
  config/
    database.ts          # Mongoose connection
    env.ts               # Environment loader
  controllers/           # Business logic (one file per resource)
  middleware/
    auth.middleware.ts   # JWT verify, requireAdmin, requireSeller
    asyncHandler.ts
    errorHandler.ts
  models/
    Card.model.ts           # Cards + inventory[] sub-documents
    User.model.ts           # Admin / seller / customer accounts
    Order.model.ts          # Online orders
    TikTokOrder.model.ts    # Imported TikTok orders
    TikTokCredentials.model.ts
    OfflineSale.model.ts    # Walk-in sale records
    OfflineBuy.model.ts     # Walk-in buy-back records
    Cart.model.ts
    Carousel.model.ts
    FeaturedBanner.model.ts
    FeaturedProduct.model.ts
    UBSettings.model.ts     # UB set pricing settings
    RegularSettings.model.ts
  routes/                # One route file per resource
  utils/
    regularPricing.ts    # Regular set price calculation
    ubPricing.ts         # UB set price calculation
    auth.utils.ts
  validators/
    auth.validator.ts
    card.validator.ts
  server.ts              # Entry point
uploads/images/          # Uploaded card images
create-admin.js
reset-admin-password.js
check-sets.js
check-recent-sets.js
bulkup.csv               # TikTok bulk-update CSV example
tiktok-bulk-update-template.csv
TIKTOK_CSV_INSTRUCTIONS.md
`

---

## Data Models

### Card
Core document with an inventory[] array of slots (one per seller + condition + finish combo).

`	ypescript
// Card top-level fields
{
  name: string
  setCode: string               // e.g. "BLB"
  setName: string
  collectorNumber: string
  language: string              // default "EN"
  rarity: "common" | "uncommon" | "rare" | "mythic" | "special" | "bonus"
  colorIdentity: string[]       // ["W","U","B","R","G"]
  imageUrl?: string
  scryfallId?: string
  typeLine?: string
  oracleText?: string
  manaCost?: string
  isActive: boolean             // soft delete flag
}

// InventoryItem (sub-document inside card.inventory[])
{
  condition: "NM" | "LP" | "P"
  finish: "nonfoil" | "foil" | "etched"
  quantityOwned: number
  quantityForSale: number
  buyPrice: number
  sellPrice: number
  marketplacePrice?: number     // TikTok/Tokopedia price (incl. platform fee)
  sellerId?: string
  sellerName?: string
  tiktokProductId?: string      // written back from bulkup CSV sync
  tiktokSkuId?: string          // written back from bulkup CSV sync
  sellerSku?: string            // used to match CSV rows to inventory slots
}
`

### User
`	ypescript
{
  email: string
  passwordHash: string
  role: "admin" | "seller" | "customer"
  displayName?: string
}
`

---

## API Routes

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/auth/register | Register customer account |
| GET | /api/auth/me | Get current user |

### Public (no auth)
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/cards | Search/filter cards |
| GET | /api/cards/:id | Card details |
| GET | /api/public/carousel | Active carousel items |
| GET | /api/public/featured | Featured banners and products |

### Admin (JWT + admin role)
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/admin/stats | Dashboard stats |
| GET/POST/PUT/DELETE | /api/admin/cards | Card management |
| POST | /api/admin/cards/bulk-upload | CSV card import |
| GET/POST/DELETE | /api/admin/sellers | Seller accounts |
| GET/POST | /api/admin/offline-sales | Walk-in sales |
| POST | /api/admin/offline-sales/:id/void | Void a sale |
| GET/POST | /api/admin/offline-buys | Walk-in buy-backs |
| GET/PUT | /api/admin/ub-pricing | UB pricing settings |
| GET/PUT | /api/admin/ub-settings | UB set list |
| GET/PUT | /api/admin/regular-pricing | Regular pricing settings |
| POST | /api/admin/sync-prices | Recalculate all prices from CK |
| GET/POST/PUT/DELETE | /api/admin/carousel | Carousel management |
| GET/POST/PUT/DELETE | /api/admin/featured | Featured content |
| POST | /api/tiktok/bulk-update-csv-stream | Bulk price+stock update (SSE stream) |
| POST | /api/tiktok/bulk-update-csv | Bulk price+stock update (legacy) |

### Seller (JWT + seller role)
| Method | Endpoint | Description |
|---|---|---|
| GET/POST/PUT | /api/seller/inventory | Own inventory |
| GET | /api/seller/orders | Own assigned orders |
| POST | /api/manabox/upload | Manabox CSV import |

---

## Bulk CSV Upload (Card Import)

Use ulk-upload-template.csv for the card import format. Required columns:

ame, setCode, setName, collectorNumber, language, condition, finish, quantityOwned, quantityForSale, buyPrice, sellPrice, rarity

Optional: colorIdentity, imageUrl, scryfallId, typeLine, oracleText, manaCost, notes

---

## TikTok Shop Bulk Update CSV

See TIKTOK_CSV_INSTRUCTIONS.md and 	iktok-bulk-update-template.csv for full details.

Columns: productId, skuId, sellerSku, productName, price, stock

- productId and skuId use a ' prefix to prevent Excel scientific notation
- sellerSku matches the CSV row to the correct inventory slot in the database
- After a successful sync, 	iktokProductId and 	iktokSkuId are written back to the matched inventory item

---

## License

ISC