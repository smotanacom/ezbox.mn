# EzBox.mn - Modular Kitchen Store

A modern e-commerce platform for modular kitchen products in Mongolia, built with Next.js, Supabase, and Tailwind CSS.

## 🚀 Quick Start

```bash
npm install
npm run dev          # Start the app
```

Visit **http://localhost:3000**

**Note:** You need to set up Supabase first (see Setup Instructions below).

## Features

- **Product Catalog**: Browse products organized by categories
- **Product Configuration**: Customize products with various parameters (colors, dimensions, etc.)
- **Dynamic Pricing**: Prices update based on selected parameters
- **Shopping Cart**: Add, update, and remove products with specific configurations
- **Special Offers**: Pre-configured product bundles at discounted prices
- **Phone-based Authentication**: 8-digit Mongolian phone number with mandatory password
- **Guest Shopping**: Browse and add to cart without logging in

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Custom phone-based auth with bcrypt password hashing
- **Deployment**: Vercel

## Project Structure

```
ezbox/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with CartProvider
│   ├── page.tsx           # Home page
│   ├── products/          # Products page
│   └── globals.css        # Global styles
├── components/            # React components (future)
├── contexts/              # React contexts
│   └── CartContext.tsx   # Cart state management
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Supabase client
│   ├── api.ts            # API functions
│   └── auth.ts           # Authentication functions
├── types/                 # TypeScript definitions
│   └── database.ts       # Database types
├── supabase/             # Database migrations
│   ├── migrations/       # SQL migration files
│   │   ├── 0001_init.sql        # Initial schema
│   │   └── 0002_seed_data.sql   # Seed data
│   └── migrate.js        # Migration runner script
└── public/               # Static assets
```

## Database Schema

### Core Tables

- **categories**: Product categories (Base Box, Wall Box, Partial, Ready Products)
- **products**: Individual products with base prices
- **parameter_groups**: Configuration options (Handle, Depth, Height, Width, Colour, Shelf, Quantity, Rail)
- **parameters**: Specific values for parameters with price modifiers
- **product_parameter_groups**: Links products to their configurable parameters
- **users**: Registered users with phone authentication
- **carts**: Shopping carts (tied to users or guest sessions)
- **product_in_cart**: Cart items with selected configurations
- **orders**: Completed orders
- **specials**: Pre-configured product bundles at discounts
- **special_items**: Products included in specials

## Setup Instructions (Supabase + Vercel)

### 1. Clone and Install

```bash
cd ezbox
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Copy your project URL and anon key

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PASSWORD=your-database-password
```

### 4. Run Migrations

Run the database migrations to set up the schema and seed data:

**Option 1: Using the migration script (automated)**
```bash
npm run migrate:run
```

**Option 2: Manual (via Supabase SQL Editor)**
```bash
npm run migrate
```
This will display the SQL migrations. Copy and paste them into the Supabase SQL Editor.

### 5. Development Server

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run migrate` - Display database migrations
- `npm run migrate:run` - Run database migrations (requires Supabase credentials)
- `npm run deploy` - Deploy to Vercel production
- `npm run deploy:preview` - Deploy to Vercel preview

## Migration System

The project includes a custom migration system that:

1. Tracks applied migrations in `schema_migrations` table
2. Automatically runs pending migrations in order
3. Uses transactions for safety
4. Can be run multiple times safely (idempotent)

To create a new migration:

1. Create a new file in `supabase/migrations/` with format `####_name.sql`
2. Add your SQL statements
3. Include: `INSERT INTO schema_migrations (version) VALUES ('####_name');` at the end
4. Run `npm run migrate`

## Pages

### Home Page (`/`)
- Displays the EzBox.mn branding
- Shows available special offers with "Add to Cart" buttons
- Lists all categories and their products in a table format
- Click on categories or products to navigate to Products page

### Products Page (`/products`)
- **Product Configuration Table**:
  - Select category
  - Select product
  - Configure parameters (dropdowns for each parameter group)
  - Set quantity
  - View live price calculation
  - Add to cart
- **Cart Table**:
  - View all cart items
  - Edit quantity
  - View configuration for each item
  - Remove items
  - See total price
  - Checkout button (placeholder)

## Authentication

The system uses custom phone-based authentication:

- Users register with 8-digit Mongolian phone numbers
- Password is mandatory (no length or character restrictions as per requirements)
- Passwords are hashed using bcrypt
- Sessions stored in localStorage
- Guest users can shop with temporary session IDs

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Future Enhancements

- Image upload for products, categories, and parameters
- Admin panel for managing products and orders
- Order checkout and payment integration
- User dashboard with order history
- Product search and filtering
- Responsive image galleries
- Email/SMS notifications
- Inventory management
- Advanced reporting and analytics

## License

ISC
