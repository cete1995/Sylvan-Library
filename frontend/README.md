# Boardgame Time - Frontend

React 18 + TypeScript + Vite frontend for the Boardgame Time MTG & café app.

---

## Quick Start

`ash
cd frontend
npm install
npm run dev    # http://localhost:5173
`

Requires the backend running on port 5000 (or set VITE_API_URL in .env).

---

## Build

`ash
npm run build    # output in frontend/dist/
npm run preview  # local preview of production build
`

---

## Environment Variables (optional)

Create rontend/.env:

`
VITE_API_URL=http://localhost:5000/api
`

If not set, defaults to http://localhost:5000/api.

---

## Project Structure

`
frontend/src/
  api/              # Axios API wrappers (one file per resource)
    admin.ts
    auth.ts
    cards.ts
    cart.ts
    order.ts
    seller.ts
    pricing.ts
    cafe.ts           # Boardgame café settings (getSettings / updateSettings)
    tiktok (via admin.ts / debug page)
    ...
  components/       # Shared UI components
    Navbar.tsx
    BottomNav.tsx
    BottomSheet.tsx
    ...
  contexts/
    AuthContext.tsx
    CartContext.tsx
    ThemeContext.tsx
  pages/
    --- Public ---
    HomePage.tsx
    CatalogPage.tsx          # Desktop card catalog
    CatalogPageV2.tsx
    MobileCatalogFeed.tsx    # Mobile card feed
    CardDetailPage.tsx
    LoginPage.tsx            # Unified login (admin/seller/customer)
    RegisterPage.tsx
    CartPage.tsx
    OrderHistoryPage.tsx
    OrderDetailPage.tsx
    ProfilePage.tsx
    CafePage.tsx             # Boardgame Café & Mahjong info (live from API)
    --- Admin ---
    AdminDashboardPage.tsx
    AdminCardListPage.tsx         # Browse cards, sortable, finish badges, per-finish prices
    AdminCardFormPage.tsx         # Add / edit card
    AdminBulkUploadPage.tsx       # CSV card import
    AdminSetUploadPage.tsx        # Upload set JSON
    AdminMissingImagesPage.tsx    # Cards without images
    AdminSellerManagementPage.tsx
    AdminPriceManagementPage.tsx  # CK sync + bulk price update
    AdminUBPricingPage.tsx
    AdminUBSettingsPage.tsx
    AdminRegularSettingsPage.tsx
    AdminCarouselPage.tsx
    AdminFeaturedPage.tsx
    AdminOfflineSalePage.tsx      # Walk-in sales
    AdminOfflineBuyPage.tsx       # Walk-in buy-backs
    AdminTikTokDebugPage.tsx      # TikTok bulk update (CSV upload + SSE progress)
    AdminTikTokGetOrdersPage.tsx
    AdminTikTokOrdersPage.tsx
    AdminTikTokSavedOrdersPage.tsx
    AdminTikTokOrderDetailPage.tsx
    AdminMembershipPage.tsx
    AdminDebugPage.tsx            # System maintenance tools
    AdminCafePage.tsx             # Boardgame Café content editor
    --- Seller ---
    SellerDashboardPage.tsx
    SellerInventoryFormPage.tsx
    ManaboxUploadPage.tsx
  types/
    index.ts    # Card, InventoryItem, User, Order, etc.
  App.tsx       # Route definitions
  main.tsx
  index.css
  theme.css
`

---

## Routes

### Public
| Path | Page |
|---|---|
| / | Home |
| /catalog | Card catalog (desktop table, mobile feed) |
| /cards/:id | Card detail |
| /cafe | Boardgame Café & Mahjong info |
| /login | Login (admin / seller / customer) |
| /register | Customer registration |
| /cart | Shopping cart |
| /orders | Order history (requires login) |
| /orders/:id | Order detail (requires login) |
| /profile | Profile (requires login) |

### Admin (requires admin login)
| Path | Page |
|---|---|
| /admin/dashboard | Dashboard overview |
| /admin/cards | Browse and manage card inventory |
| /admin/cards/new | Add new card |
| /admin/cards/edit/:id | Edit card |
| /admin/bulk-upload | Bulk CSV import |
| /admin/set-upload | Upload set JSON |
| /admin/missing-images | Cards without images |
| /admin/sellers | Seller management |
| /admin/prices | Price management and CK sync |
| /admin/ub-pricing | UB pricing multiplier settings |
| /admin/ub-settings | UB set list |
| /admin/regular-settings | Regular pricing settings |
| /admin/carousel | Carousel management |
| /admin/featured | Featured banners and products |
| /admin/offline-sales | Walk-in sales |
| /admin/offline-buys | Walk-in buy-backs |
| /admin/tiktok-debug | TikTok bulk update and debug |
| /admin/tiktok-get-orders | Fetch TikTok orders |
| /admin/tiktok-orders | TikTok order list |
| /admin/tiktok-saved-orders | Saved/assigned TikTok orders |
| /admin/tiktok-orders/:orderId | TikTok order detail |
| /admin/membership | Customer membership |
| /admin/debug | System maintenance tools |
| /admin/cafe | Boardgame Café content editor |

### Seller (requires seller login)
| Path | Page |
|---|---|
| /seller/dashboard | Seller dashboard and inventory |
| /seller/cards/:id/inventory | Edit inventory for a card |
| /seller/manabox-upload | Manabox CSV import |

---

## Key TypeScript Types

`	ypescript
// InventoryItem - sub-document on each Card
interface InventoryItem {
  condition: 'NM' | 'LP' | 'P';
  finish: 'nonfoil' | 'foil' | 'etched';
  quantityOwned: number;
  quantityForSale: number;
  buyPrice: number;
  sellPrice: number;
  marketplacePrice?: number;   // TikTok/Tokopedia price
  sellerId?: string;
  sellerName?: string;
  tiktokProductId?: string;
  tiktokSkuId?: string;
  sellerSku?: string;          // links CSV row to this inventory slot
}
`

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Styling |
| React Router v6 | Client-side routing |
| Axios | API calls |
| Keyrune (ss-icons) | MTG set symbol icons |
| SheetJS (xlsx) | XLSX export (TikTok failed-rows download) |