# MTG Inventory Frontend

React + TypeScript + Vite frontend for the MTG Card Inventory & Store system.

## Features

- Modern React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- JWT authentication
- Public card catalog with search and filters
- Admin dashboard for inventory management
- Responsive design

## Prerequisites

- Node.js 18+ and npm
- Backend API running on port 5000

## Installation

```bash
npm install
```

## Running the App

### Development mode:
```bash
npm run dev
```

The app will start on `http://localhost:5173`

### Production build:
```bash
npm run build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client and endpoints
│   ├── components/       # Reusable components
│   ├── contexts/         # React contexts (auth)
│   ├── pages/            # Page components
│   ├── types/            # TypeScript types
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles with Tailwind
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Available Routes

### Public Routes
- `/` - Home page
- `/catalog` - Browse cards with search and filters
- `/cards/:id` - Card detail page
- `/admin/login` - Admin login

### Protected Admin Routes
- `/admin/dashboard` - Admin dashboard with stats
- `/admin/cards` - Manage cards (list/edit/delete)
- `/admin/cards/new` - Add new card
- `/admin/cards/edit/:id` - Edit card
- `/admin/bulk-upload` - Bulk upload CSV

## Environment Variables

Create a `.env` file (optional):

```
VITE_API_URL=http://localhost:5000/api
```

If not set, defaults to `http://localhost:5000/api`

## Usage

1. Start the backend server first (see backend README)
2. Start the frontend: `npm run dev`
3. Open `http://localhost:5173` in your browser
4. Login with your admin credentials at `/admin/login`
5. Start managing your MTG card inventory!

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Context** - State management for auth

## License

ISC
