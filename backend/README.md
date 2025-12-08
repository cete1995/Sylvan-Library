# MTG Inventory Backend

This is the backend API for the MTG Card Inventory & Store system.

## Features

- RESTful API with Express & TypeScript
- MongoDB database with Mongoose ODM
- JWT-based authentication
- Card CRUD operations with search and filtering
- Bulk CSV upload for cards
- Admin dashboard statistics

## Prerequisites

- Node.js 18+ and npm
- MongoDB (running locally or connection string)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and update:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string for JWT signing
- `FRONTEND_URL`: Your frontend URL (for CORS)

3. Start MongoDB (if running locally):
```bash
# Windows (if installed as service)
net start MongoDB

# Or using mongod directly
mongod --dbpath C:\data\db
```

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production build:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/register` - Register new admin user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info (requires auth)

### Public Card Endpoints
- `GET /api/cards` - Search and browse cards
  - Query params: `q`, `set`, `color`, `rarity`, `minPrice`, `maxPrice`, `page`, `limit`, `sort`
- `GET /api/cards/:id` - Get single card details
- `GET /api/cards/sets/list` - Get list of available sets

### Admin Endpoints (Require JWT Token)
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/cards` - Get all cards (admin view)
- `POST /api/admin/cards` - Create new card
- `PUT /api/admin/cards/:id` - Update card
- `DELETE /api/admin/cards/:id` - Soft delete card
- `POST /api/admin/cards/bulk-upload` - Upload CSV file with cards

## Creating Your First Admin User

1. Start the server: `npm run dev`
2. Use a tool like Postman or curl to register:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"SecurePass123\"}"
```

3. Login to get your JWT token:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"SecurePass123\"}"
```

## Bulk Upload CSV Format

See `bulk-upload-template.csv` for an example. Required columns:
- name, setCode, setName, collectorNumber, language, condition, finish
- quantityOwned, quantityForSale, buyPrice, sellPrice, rarity

Optional columns:
- colorIdentity (comma-separated: W,U,B,R,G)
- imageUrl, scryfallId, typeLine, oracleText, manaCost, notes

## Data Models

### Card Fields:
- **name**: Card name
- **setCode**: 3-letter set code (e.g., "MOM")
- **setName**: Full set name
- **collectorNumber**: Card number in set
- **language**: Language code (default: "EN")
- **condition**: NM | SP | MP | HP | DMG
- **finish**: nonfoil | foil | etched
- **quantityOwned**: Total cards owned
- **quantityForSale**: How many are listed
- **buyPrice**: Purchase price per card
- **sellPrice**: Listing price per card
- **rarity**: common | uncommon | rare | mythic | special | bonus
- **colorIdentity**: Array of color letters
- **isActive**: Soft delete flag

## Project Structure

```
backend/
├── src/
│   ├── config/         # Database and environment config
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, error handling, etc.
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API route definitions
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Helper functions
│   ├── validators/     # Zod validation schemas
│   └── server.ts       # Entry point
├── .env                # Environment variables
├── package.json
└── tsconfig.json
```

## Testing the API

Use the server at `http://localhost:5000`

Example: Get all cards
```bash
curl http://localhost:5000/api/cards?q=lightning&page=1&limit=10
```

Example: Add a card (requires JWT)
```bash
curl -X POST http://localhost:5000/api/admin/cards \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @card-data.json
```

## License

ISC
