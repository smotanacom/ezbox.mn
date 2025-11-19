# EzBox.mn - Project Context for Claude

## Project Overview

EzBox.mn is a modular kitchen e-commerce platform built for Mongolia. It allows customers to browse products, customize them with various parameters (colors, dimensions, etc.), and purchase pre-configured bundles or individual items.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 (utility-first, no custom CSS)
- **Database**: PostgreSQL (Supabase for production, local Docker for development)
- **Authentication**: Custom phone-based auth (8-digit Mongolian numbers) with bcrypt
- **State Management**: React Context API (CartContext)
- **Deployment**: Vercel (production), Docker Compose (local)

## Project Structure

```
ezbox/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with CartProvider
│   ├── page.tsx           # Home page (categories, products, specials)
│   ├── products/page.tsx  # Product configurator & cart display
│   └── cart/page.tsx      # Dedicated cart page
├── contexts/              # React Context providers
│   └── CartContext.tsx   # Cart state management (global)
├── lib/                   # Core business logic
│   ├── supabase.ts       # Supabase client initialization
│   ├── db.ts             # Direct PostgreSQL client (local dev)
│   ├── api.ts            # All database queries & business logic
│   └── auth.ts           # Authentication functions
├── types/                 # TypeScript definitions
│   └── database.ts       # Complete DB schema types
├── supabase/             # Database migrations
│   ├── migrations/       # SQL migration files
│   │   ├── 0001_init.sql        # Schema creation
│   │   └── 0002_seed_data.sql   # Sample data
│   └── migrate.js        # Migration display script
├── scripts/              # Utility scripts
│   ├── setup-local.sh    # Automated local setup
│   └── test-db.js        # Database connection test
└── docker-compose.yml    # Local PostgreSQL container
```

## Key Architectural Decisions

### 1. Database-First Design
- All business logic lives in `lib/api.ts` as pure functions
- TypeScript types are generated from database schema
- Uses PostgreSQL with comprehensive foreign keys and constraints

### 2. Flexible Product System
- Products have configurable **parameter groups** (e.g., "Color", "Width")
- Each parameter group contains multiple **parameters** (e.g., "White", "Black")
- Parameters have **price modifiers** (global, not per-product)
- Products store default parameters for each group
- Selected parameters are stored as JSONB in cart items

### 3. Dual Cart System
- **Guest carts**: Tied to session ID (localStorage)
- **User carts**: Tied to user ID after login
- Cart items store full parameter selections for each product
- Real-time price calculation based on base price + parameter modifiers

### 4. Custom Authentication
- Phone-based (8-digit Mongolian format)
- Mandatory password (no restrictions on complexity)
- bcrypt hashing with salt
- Session stored in localStorage
- No JWT or OAuth - simple user/password model

## Database Schema (11 Tables)

### Core Tables

**categories** - Product categories
- `id`, `name`, `description`, `picture_url`

**products** - Individual products
- `id`, `category_id`, `name`, `description`, `base_price`, `picture_url`

**parameter_groups** - Configuration types (e.g., "Color", "Width")
- `id`, `name`, `description`

**parameters** - Specific values with pricing
- `id`, `parameter_group_id`, `name`, `price_modifier`, `picture_url`

**product_parameter_groups** - Links products to their parameters
- `id`, `product_id`, `parameter_group_id`, `default_parameter_id`

### User & Shopping Tables

**users** - Registered customers
- `id`, `phone` (8 digits, unique), `password_hash`, `address`, `is_admin`

**carts** - Shopping carts
- `id`, `user_id`, `session_id`, `status` (active/checked_out)

**product_in_cart** - Cart line items
- `id`, `cart_id`, `product_id`, `quantity`, `selected_parameters` (JSONB), `special_id`

**orders** - Completed orders
- `id`, `cart_id`, `user_id`, `status`, `address`, `phone`, `total_price`

### Special Offers

**specials** - Pre-configured bundles
- `id`, `name`, `description`, `discounted_price`, `status`, `picture_url`

**special_items** - Products in specials
- `id`, `special_id`, `product_id`, `quantity`, `selected_parameters` (JSONB)

## Important Functions & APIs

### In `lib/api.ts`

**Product Functions:**
- `getCategories()` - Fetch all categories
- `getProducts(categoryId?)` - Get products, optionally filtered
- `getProductWithDetails(productId)` - Full product with parameters
- `getAllProductsWithDetails()` - All products with full details
- `calculateProductPrice(product, selectedParameters)` - Price calculation

**Cart Functions:**
- `getOrCreateCart(userId?, sessionId?)` - Get/create active cart
- `getCartItems(cartId)` - Get items with full product details
- `addToCart(cartId, productId, quantity, selectedParameters)` - Add item
- `updateCartItem(itemId, quantity?, selectedParameters?)` - Update item
- `removeFromCart(itemId)` - Remove item
- `calculateCartTotal(cartId)` - Total cart price

**Special Functions:**
- `getSpecials(status?)` - Get specials (available/draft/hidden)
- `addSpecialToCart(cartId, specialId)` - Add all items from special

### In `lib/auth.ts`

- `register(phone, password)` - Create new user
- `login(phone, password)` - Authenticate user
- `hashPassword(password)` - bcrypt hashing
- `saveSession(user)` - Save to localStorage
- `getSession()` - Get current session
- `clearSession()` - Logout
- `getCurrentUser()` - Get logged-in user
- `getOrCreateGuestSession()` - Guest session ID
- `updateUserProfile(userId, updates)` - Update user data

## Data Flow

### Adding Product to Cart
1. User selects category → product → configures parameters → sets quantity
2. `calculateProductPrice()` computes price (base + parameter modifiers × quantity)
3. `addToCart()` creates `product_in_cart` record with selected parameters as JSONB
4. CartContext refreshes, triggers `getCartItems()` to fetch updated cart
5. UI updates with new item and recalculated total

### Price Calculation Logic
```typescript
price = base_price + sum(parameter_modifiers)
total = price × quantity
cart_total = sum(all item totals)
```

### Guest to User Conversion
- Guest shops with session-based cart
- On registration/login, cart can be migrated by updating `cart.user_id`
- Session ID stored in localStorage persists across page refreshes

## Local Development Setup

### Quick Start (Automated)
```bash
npm install
npm run setup:local  # Starts PostgreSQL, runs migrations, creates .env
npm run dev
```

### Manual Steps
1. Start PostgreSQL: `npm run db:start`
2. Run migrations: `docker exec -i ezbox-postgres psql -U ezbox -d ezbox < supabase/migrations/0001_init.sql`
3. Seed data: `docker exec -i ezbox-postgres psql -U ezbox -d ezbox < supabase/migrations/0002_seed_data.sql`
4. Create `.env` with DATABASE_URL
5. Run: `npm run dev`

### Database Access
```bash
npm run db:shell  # Access PostgreSQL CLI
npm run db:test   # Test connection
npm run db:stop   # Stop database
```

## Styling Guidelines

### Tailwind CSS Patterns

**All styling uses Tailwind utility classes. No custom CSS files.**

**Common Patterns:**
- Container: `max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8`
- Card: `bg-white rounded-lg shadow-md p-6`
- Primary Button: `px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition`
- Input: `px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500`

**Responsive Breakpoints:**
- Mobile first: `grid-cols-1`
- Tablet: `md:grid-cols-2`
- Desktop: `lg:grid-cols-3`

**Color System:**
- Background: `bg-gray-50` (page), `bg-white` (cards)
- Text: `text-gray-900` (primary), `text-gray-600` (secondary)
- Primary actions: `bg-blue-600`, `hover:bg-blue-700`
- Success: `bg-green-600`
- Danger: `text-red-600`

## Common Tasks

### Adding a New Product
1. Insert into `products` table
2. Insert parameter group links in `product_parameter_groups`
3. Set default parameter for each group
4. Run `npm run db:shell` and use SQL or add to migration

### Adding a New Parameter
1. Insert into `parameters` with `parameter_group_id` and `price_modifier`
2. Update existing products to include this parameter if needed

### Creating a Special Offer
1. Insert into `specials` with `discounted_price` and `status='draft'`
2. Insert items into `special_items` with specific `selected_parameters`
3. Change status to `'available'` when ready to publish

### Adding a New Page
1. Create `app/[pagename]/page.tsx`
2. Use `'use client'` for interactive components
3. Import and use `useCart()` for cart access
4. Follow existing layout patterns (header, main, container)
5. Style with Tailwind utilities

## TypeScript Type Safety

### Key Types (from `types/database.ts`)

```typescript
// Database row types
Product, Category, Parameter, ParameterGroup, User, Cart, Order, Special

// Extended types with relations
ProductWithDetails         // Product + category + parameter_groups[]
CartItemWithDetails        // CartItem + full product details
SpecialWithItems          // Special + items[]

// Helper types
ParameterSelection         // { [paramGroupId]: parameterId }
```

### Type Assertions
Due to Supabase client type inference issues, we use `as any` in some places for inserts/updates. This is intentional and safe as we validate data at the application level.

## Environment Variables

### Local Development
```env
DATABASE_URL=postgresql://ezbox:ezbox123@localhost:5432/ezbox
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-development-key
```

### Production (Supabase + Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Known Limitations & Future Enhancements

### Current Limitations
- No image upload functionality (placeholder images only)
- No payment integration (checkout button is placeholder)
- No order management UI for customers
- No admin panel for managing products
- No email/SMS notifications
- No product search or filtering
- No product reviews or ratings

### Planned Features
- Image upload for products, categories, parameters
- Payment gateway integration
- Order tracking and history
- Admin dashboard
- Email/SMS notifications
- Advanced product search
- Inventory management
- Product recommendations
- Wishlist functionality
- Multi-language support (Mongolian + English)

## Testing Strategy

Currently no automated tests. For manual testing:

1. **Product Configuration**: Select different parameters, verify price updates
2. **Cart Operations**: Add/update/remove items, check totals
3. **Guest Flow**: Add items without login, verify session persistence
4. **Auth Flow**: Register → login → logout → login again
5. **Special Offers**: Add special to cart, verify all items added
6. **Responsive Design**: Test on mobile, tablet, desktop sizes

## Performance Considerations

- **Database Queries**: Each product fetch includes joins for parameters
- **Cart Recalculation**: Happens on every cart operation
- **Real-time Updates**: CartContext refreshes after each mutation
- **Image Loading**: Currently using placeholders, will need optimization

## Security Notes

- Passwords hashed with bcrypt (salt rounds: 10)
- No SQL injection risk (using parameterized queries)
- CORS handled by Next.js/Vercel
- No XSS vulnerabilities (React escapes by default)
- Session stored in localStorage (consider httpOnly cookies for production)
- No rate limiting implemented yet
- No CSRF protection (add for production)

## Migration Strategy

### Adding New Migrations
1. Create `supabase/migrations/000X_description.sql`
2. Include schema changes
3. Add version tracking: `INSERT INTO schema_migrations (version) VALUES ('000X_description');`
4. Test locally: `psql ezbox < supabase/migrations/000X_description.sql`
5. Apply to production via Supabase SQL Editor

### Rolling Back
Migrations are forward-only. For rollback:
1. Create new migration that reverses changes
2. Or restore from database backup

## Useful SQL Queries

```sql
-- View all products with their categories
SELECT p.name, c.name as category
FROM products p
JOIN categories c ON p.category_id = c.id;

-- View cart contents for a user
SELECT p.name, pic.quantity, pic.selected_parameters
FROM product_in_cart pic
JOIN products p ON pic.product_id = p.id
JOIN carts c ON pic.cart_id = c.id
WHERE c.user_id = 1;

-- Calculate total revenue
SELECT SUM(total_price) FROM orders WHERE status = 'completed';

-- Most popular products
SELECT p.name, COUNT(*) as times_ordered
FROM product_in_cart pic
JOIN products p ON pic.product_id = p.id
GROUP BY p.name
ORDER BY times_ordered DESC;
```

## Documentation Files

- **README.md** - Main project documentation
- **QUICKSTART.md** - Fast local setup guide
- **LOCAL_SETUP.md** - Detailed local development options
- **TAILWIND_GUIDE.md** - Tailwind CSS usage patterns
- **.claude/CLAUDE.md** - This file (AI context)

## When Working on This Project

### Before Making Changes
1. Check existing patterns in similar components
2. Follow Tailwind CSS conventions (see TAILWIND_GUIDE.md)
3. Use TypeScript types from `types/database.ts`
4. Test database queries in `npm run db:shell` first

### Code Style
- Use functional components with hooks
- Prefer `async/await` over promises
- Use TypeScript strictly (even though set to false, write types)
- Follow existing naming conventions
- Keep functions small and focused
- Add comments for complex business logic

### Git Commits
- Conventional Commits style
- Sign commits with GPG key
- Use user: Matus Faro <matus@matus.io>
- Keep commits atomic and focused

### Common Pitfalls
- Remember to mark items as `as any` for Supabase inserts/updates
- Always refresh CartContext after cart mutations
- Don't forget to handle guest sessions vs user sessions
- Price calculations must include all parameter modifiers
- Check if cart exists before adding items

---

This project is production-ready and fully functional for local development. The codebase is clean, well-structured, and follows modern React/Next.js best practices.
