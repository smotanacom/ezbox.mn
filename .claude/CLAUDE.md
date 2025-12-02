# EzBox.mn - Project Context for Claude

## Project Overview

EzBox.mn is a modular kitchen e-commerce platform built for Mongolia. It allows customers to browse products, customize them with various parameters (colors, dimensions, etc.), and purchase pre-configured bundles or individual items.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 (utility-first, no custom CSS)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom phone-based auth (8-digit Mongolian numbers) with bcrypt
- **State Management**: React Context API (CartContext)
- **Deployment**: Vercel

## Project Structure

```
ezbox/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with LanguageProvider & CartProvider
│   ├── page.tsx           # Home page (categories, products, specials)
│   ├── products/page.tsx  # Product configurator & cart display
│   └── cart/page.tsx      # Dedicated cart page
├── contexts/              # React Context providers
│   ├── CartContext.tsx   # Cart state management (global)
│   └── LanguageContext.tsx # Language/translation management (global)
├── translations/          # Bilingual text content
│   ├── en.ts             # English translations (fallback)
│   └── mn.ts             # Mongolian translations (default)
├── lib/                   # Core business logic
│   ├── supabase.ts       # Supabase client initialization
│   ├── api.ts            # All database queries & business logic
│   └── auth.ts           # Authentication functions
├── types/                 # TypeScript definitions
│   ├── database.ts       # Complete DB schema types
│   └── translations.ts   # Translation system types
├── supabase/             # Database migrations
│   ├── migrations/       # SQL migration files
│   │   ├── 0001_init.sql        # Schema creation
│   │   └── 0002_seed_data.sql   # Sample data
│   └── migrate.js        # Migration display script
└── scripts/              # Utility scripts
    └── run-migrations.js # Migration runner script
```

## Key Architectural Decisions

### 1. Database-First Design
- All business logic lives in `lib/api.ts` as pure functions
- TypeScript types are generated from database schema
- Uses Supabase (PostgreSQL) with comprehensive foreign keys and constraints

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

### 5. Bilingual Support (Mongolian/English)
- **Default language**: Mongolian (`mn`)
- **Fallback language**: English (`en`)
- **ALL user-facing text MUST use the translation system** - no exceptions
- Translation files: `translations/mn.ts` (Mongolian), `translations/en.ts` (English)
- Language context: `contexts/LanguageContext.tsx` provides `useTranslation()` hook
- Translation hook usage: `const { t } = useTranslation()` then `t('translation.key')`
- **Language preference**: Stored in localStorage, persists across sessions

**CRITICAL RULES - MUST FOLLOW**:

1. **NEVER hardcode user-facing text** - buttons, labels, messages, placeholders, titles, descriptions, etc.
2. **ALWAYS add translation keys to BOTH files** - `translations/en.ts` AND `translations/mn.ts`
3. **ALWAYS use the translation hook** - import and use `useTranslation()` in every component with user-facing text
4. **EVERY new text MUST be translatable** - When writing any new code, immediately add translations to both files
5. **VERIFY before completing** - Check that all user-visible text uses `t('...')` before marking a task as done

**Step-by-Step Process for Adding New Text**:

1. **Identify the text** - Any text that users will see needs translation
2. **Create a translation key**:
   - Use kebab-case: `'feature.description'`
   - Group by feature/page: `'home.*'`, `'cart.*'`, `'products.*'`, `'checkout.*'`
   - Be descriptive: `'cart.empty-message'` not `'cart.msg1'`
3. **Add to both translation files**:
   ```typescript
   // translations/en.ts
   'cart.empty-message': 'Your cart is empty',

   // translations/mn.ts
   'cart.empty-message': 'Таны сагс хоосон байна',
   ```
4. **Use in component**:
   ```typescript
   import { useTranslation } from '@/contexts/LanguageContext';

   export default function MyComponent() {
     const { t } = useTranslation();
     return <p>{t('cart.empty-message')}</p>;
   }
   ```

**Examples**:

```typescript
// ❌ WRONG - Hardcoded text
<button>Add to Cart</button>
<h1>Shopping Cart</h1>
<p>Your cart is empty</p>
<input placeholder="Enter your phone number" />

// ✅ CORRECT - Using translation system
const { t } = useTranslation();
<button>{t('products.add-to-cart')}</button>
<h1>{t('cart.title')}</h1>
<p>{t('cart.empty')}</p>
<input placeholder={t('checkout.phone-placeholder')} />
```

**Dynamic Text with Variables**:
When you need to include dynamic values (like counts), use string replacement:
```typescript
// In translations/en.ts
'category.view-all': 'View all {count} products',

// In component
<span>{t('category.view-all').replace('{count}', products.length.toString())}</span>
```

**Conditional Text**:
```typescript
// In translations
'cart.item-count': 'item',
'cart.items-count': 'items',

// In component
{items.length} {items.length === 1 ? t('cart.item-count') : t('cart.items-count')}
```

**Common Patterns**:
- Buttons: `'feature.action'` (e.g., `'cart.checkout'`, `'products.add'`)
- Status messages: `'feature.status'` (e.g., `'cart.loading'`, `'products.added'`)
- Empty states: `'feature.empty-message'` (e.g., `'cart.empty-message'`)
- Form labels: `'feature.field-name'` (e.g., `'checkout.phone'`, `'account.name'`)
- Error messages: `'feature.error-description'` (e.g., `'cart.failed-update'`)

**Language Switcher**: Flag-based toggle in header (🇬🇧/🇲🇳), positioned rightmost in navigation. Shows opposite language flag (when Mongolian is active, shows UK flag to switch to English).

### 6. History Tracking System

**CRITICAL: All changes to orders, products, and other entities MUST be recorded in the history table.**

#### When to Record History

You MUST create a history record whenever:
- **Orders**: Status changes, address updates, contact information changes
- **Products**: Price changes, status changes, name/description updates
- **Specials**: Status changes, price changes
- **Any other entity**: Any field that affects business operations or customer experience

#### How to Record History

**Step 1**: Import the history function
```typescript
import { createHistoryRecord } from '@/lib/api';
```

**Step 2**: Before updating an entity, get the current value
```typescript
// Example: Before updating order status
const { data: currentOrder } = await supabase
  .from('orders')
  .select('status')
  .eq('id', orderId)
  .single();

const oldStatus = currentOrder?.status;
```

**Step 3**: Perform the update
```typescript
const { data, error } = await supabase
  .from('orders')
  .update({ status: newStatus })
  .eq('id', orderId)
  .select()
  .single();
```

**Step 4**: Record the change in history
```typescript
await createHistoryRecord({
  entity_type: 'order',           // 'order', 'product', 'special', etc.
  entity_id: orderId,              // ID of the entity that changed
  action: 'status_changed',        // 'created', 'updated', 'status_changed', 'deleted', etc.
  field_name: 'status',            // Optional: specific field that changed
  old_value: oldStatus,            // Optional: previous value
  new_value: newStatus,            // Optional: new value
  changed_by_admin_id: adminId,    // If changed by admin
  changed_by_user_id: userId,      // If changed by user
  notes: 'Additional context',     // Optional: any additional notes
});
```

#### History Actions

Use these standard action names:
- `'created'` - Entity was created
- `'updated'` - General update (when field_name is specified)
- `'status_changed'` - Status field changed
- `'deleted'` - Entity was deleted (soft delete)
- `'note_added'` - Note or comment was added

#### Who Changed It

Always track who made the change:
- **Admin changes**: Pass `changed_by_admin_id` (from `requireAdmin()` result)
- **User changes**: Pass `changed_by_user_id` (from user session)
- **System changes**: Omit both IDs and add a note like "Automated system update"

#### Example: Complete Order Status Update

```typescript
export async function updateOrderStatus(
  orderId: number,
  status: string,
  changedByAdminId?: number
): Promise<Order> {
  // 1. Get current state
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  const oldStatus = currentOrder?.status;

  // 2. Perform update
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  // 3. Record history (only if status actually changed)
  if (oldStatus && oldStatus !== status) {
    await createHistoryRecord({
      entity_type: 'order',
      entity_id: orderId,
      action: 'status_changed',
      field_name: 'status',
      old_value: oldStatus,
      new_value: status,
      changed_by_admin_id: changedByAdminId,
    });
  }

  return data as Order;
}
```

#### History API Functions

Available in `lib/api.ts`:
- `createHistoryRecord(record)` - Create a new history entry
- `getHistoryForEntity(entity_type, entity_id)` - Get all history for an entity
- `getRecentHistory(limit)` - Get recent history across all entities

#### Viewing History

History is automatically displayed in the admin order detail page (`app/admin/orders/[id]/page.tsx`). It shows:
- What action was performed
- What changed (field name, old → new values)
- Who made the change (admin username or user phone)
- When it happened (formatted timestamp)

**Remember**: History tracking is NOT optional - it's a critical audit trail for business operations. Always add history tracking when implementing new update endpoints or functions.

## Database Schema (12 Tables)

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

### History Tracking

**history** - Audit trail for all entity changes
- `id`, `entity_type`, `entity_id`, `action`, `field_name`, `old_value`, `new_value`
- `changed_by_user_id`, `changed_by_admin_id`, `notes`, `created_at`
- Tracks all changes to orders, products, and other entities
- Linked to both `users` (for customer changes) and `admins` (for admin changes)
- See "History Tracking System" section above for usage guidelines

### Admin Management

**admins** - Admin users for backend management
- `id`, `username`, `password_hash`, `email`, `created_at`, `updated_at`
- Separate from regular users table
- Email field is used for system notifications (order confirmations, custom design requests)
- All admin emails receive notifications automatically

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

## Development Setup

### Quick Start
1. Create a Supabase project at https://supabase.com
2. Copy `.env.example` to `.env` and add your Supabase credentials
3. Run migrations using the Supabase SQL Editor or `npm run migrate:run`
4. Start development: `npm run dev`

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
1. Insert into `products` table via Supabase SQL Editor
2. Insert parameter group links in `product_parameter_groups`
3. Set default parameter for each group

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

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PASSWORD=your-database-password

# AWS SES for email notifications
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SES_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_SES_FROM_EMAIL=noreply@ezbox.mn
# Note: Admin notification emails are now configured in the database (admins.email column)
# AWS_SES_ADMIN_EMAIL is DEPRECATED
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
4. Apply via Supabase SQL Editor or run `npm run migrate:run`

### Rolling Back
Migrations are forward-only. For rollback:
1. Create new migration that reverses changes
2. Or restore from database backup

## Supabase CLI Usage

This project is linked to Supabase CLI for database management and queries.

### Setup Status
- **CLI Installed**: ✅ via Homebrew
- **Project Linked**: ✅ `fektlcibbblleeglyjgy` (EzBox)
- **Authentication**: Logged in globally

### Common CLI Commands

**Database Queries:**
```bash
# Query via Node.js (using existing supabase client)
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
(async () => {
  const { data, error } = await supabase.from('categories').select('*');
  console.log(data);
})();
"
```

**Migration Management:**
```bash
# List all migrations and their status
supabase migration list

# Create a new migration
supabase migration new my_migration_name

# Push migrations to remote database
supabase db push

# Pull schema changes from remote
supabase db pull

# Repair migration history (if migrations were run manually)
supabase migration repair --status applied 0001
```

**Type Generation:**
```bash
# Generate TypeScript types from database schema
supabase gen types typescript --linked > types/database.ts
```

**Project Management:**
```bash
# View linked projects
supabase projects list

# Check current project status
supabase status

# Dump database schema
supabase db dump --schema public -f backup.sql

# Dump data only
supabase db dump --data-only --schema public -f data.sql
```

### Database Connection Details
- **Project Reference**: `fektlcibbblleeglyjgy`
- **Region**: Southeast Asia (Singapore)
- **Direct Connection**: Use credentials from `.env` file
- **Pooler**: `aws-0-ap-southeast-1.pooler.supabase.com:6543`

### When Running Queries
**Prefer using the Supabase CLI or Node.js client for database operations:**
1. For quick queries: Use Node.js with the existing `@supabase/supabase-js` client
2. For schema changes: Create a new migration file
3. For data inspection: Use the Supabase Dashboard SQL Editor
4. For bulk operations: Use the CLI commands above

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
- **TAILWIND_GUIDE.md** - Tailwind CSS usage patterns
- **.claude/CLAUDE.md** - This file (AI context)

## When Working on This Project

### Before Making Changes
1. Check existing patterns in similar components
2. Follow Tailwind CSS conventions (see TAILWIND_GUIDE.md)
3. Use TypeScript types from `types/database.ts`
4. Test database queries in Supabase SQL Editor first

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

### Development Server
- **NEVER kill or restart the dev server without explicit permission**
- Next.js has hot module reloading (HMR) that automatically picks up file changes
- No need to restart when making code edits - changes will be reflected automatically
- Only suggest a restart if there are actual issues requiring it, and always ask first

### Common Pitfalls
- Remember to mark items as `as any` for Supabase inserts/updates
- Always refresh CartContext after cart mutations
- Don't forget to handle guest sessions vs user sessions
- Price calculations must include all parameter modifiers
- Check if cart exists before adding items

### 7. Next.js Link Prefetch Prevention

**CRITICAL: Always add `prefetch={false}` to Link components inside loops/maps.**

Next.js `<Link>` components automatically prefetch pages when they enter the viewport. This causes **API spam** when Links are rendered in loops (tables, grids, lists) because every visible Link triggers a prefetch request simultaneously.

**When to add `prefetch={false}`:**
- Links inside `.map()` loops (table rows, grid items, list items)
- Links in admin tables (orders, products, categories, specials, etc.)
- Links in product/special grids on public pages
- Navigation menu Links rendered in loops

**Examples:**

```typescript
// ❌ WRONG - Will cause API spam in tables/grids
{items.map((item) => (
  <Link href={`/admin/items/${item.id}`}>
    #{item.id}
  </Link>
))}

// ✅ CORRECT - Prevents prefetch spam
{items.map((item) => (
  <Link href={`/admin/items/${item.id}`} prefetch={false}>
    #{item.id}
  </Link>
))}
```

**When prefetch is OK (single Links, not in loops):**
```typescript
// These are fine without prefetch={false}
<Link href="/admin/dashboard">Dashboard</Link>
<Link href="/products">Browse Products</Link>
```

**Files that have been fixed:**
- `app/admin/orders/page.tsx`
- `app/admin/products/page.tsx`
- `app/admin/categories/page.tsx`
- `app/admin/specials/page.tsx`
- `app/admin/parameter-groups/page.tsx`
- `app/admin/custom-design/page.tsx`
- `app/specials/page.tsx`
- `components/CategoryProductGrid.tsx`
- `components/AdminNav.tsx`

**Remember**: When creating new pages with tables or grids, always add `prefetch={false}` to Links inside loops.

### 8. Performance & UX Best Practices

**CRITICAL: Follow these patterns to avoid performance issues.**

#### Avoid N+1 Query Patterns

**Problem**: Fetching related data inside a loop causes exponential database queries.

```typescript
// ❌ WRONG - N+1 pattern (10 items = 11 queries)
const items = await getCartItems(cartId);
const itemsWithDetails = await Promise.all(
  items.map(async (item) => {
    const product = await getProductWithDetails(item.product_id); // N queries!
    return { ...item, product };
  })
);

// ✅ CORRECT - Batch fetch pattern (always 7 queries)
const items = await getCartItems(cartId);
const productIds = [...new Set(items.map(i => i.product_id))];
const [products, categories, ...] = await Promise.all([
  supabase.from('products').select('*').in('id', productIds),
  supabase.from('categories').select('*'),
  // ... other parallel queries
]);
// Assemble in memory using Maps
```

**When to watch for N+1**:
- Any function that fetches data inside a `.map()` or `for` loop
- Functions called repeatedly from parent loops (e.g., `calculatePrice` for each item)
- Related data enrichment (adding product details to cart items)

#### Use React.memo for List Items

**Problem**: Components in lists re-render when parent state changes, even if their props haven't changed.

```typescript
// ❌ WRONG - Re-renders on every parent update
export default function ProductCard({ ... }) { ... }

// ✅ CORRECT - Only re-renders when props change
import { memo } from 'react';
export default memo(function ProductCard({ ... }) { ... });
```

**When to use `memo()`**:
- Components rendered in `.map()` loops (ProductCard, CartItem, TableRow)
- Components with expensive rendering (images, animations)
- Pure presentational components

#### Add Loading States (Skeletons)

**Problem**: Blank screens during data fetch create poor UX and perceived slowness.

```typescript
// ❌ WRONG - Blank screen or spinner
if (loading) return <Spinner />;

// ✅ CORRECT - Skeleton matching actual layout
if (loading) return <PageSkeleton />;
```

**Skeleton best practices**:
- Match the actual component dimensions to prevent layout shift
- Use `animate-pulse` with `bg-gray-200` for consistency
- Create page-specific skeletons (e.g., `HomePageSkeleton`, `ProductGridSkeleton`)
- Base skeleton component: `components/ui/skeleton.tsx`

#### Prevent Layout Shift (CLS)

**Problem**: Content that changes size causes jarring visual jumps.

```typescript
// ❌ WRONG - Height change causes layout shift
${isMinimized ? 'h-16' : 'h-[40vh]'}

// ✅ CORRECT - max-height with overflow-hidden for smooth transitions
${isMinimized ? 'max-h-16' : 'max-h-[40vh]'}
```

**CLS prevention checklist**:
- Use `max-height` instead of `height` for expandable sections
- Always set image dimensions or use `aspect-*` classes
- Reserve space for dynamic content (badges, buttons)
- Use `overflow-hidden` with height transitions

#### Use Optimistic Updates for Mutations

**Problem**: Waiting for API response before updating UI feels slow.

```typescript
// ❌ WRONG - Wait for server response
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['cart'] });
}

// ✅ CORRECT - Update immediately, rollback on error
onMutate: async (variables) => {
  await queryClient.cancelQueries({ queryKey: ['cart'] });
  const previousData = queryClient.getQueriesData({ queryKey: ['cart'] });
  queryClient.setQueriesData({ queryKey: ['cart'] }, (old) => {
    // Optimistically update
    return { ...old, items: old.items.map(...) };
  });
  return { previousData };
},
onError: (err, vars, context) => {
  // Rollback on error
  context?.previousData.forEach(([key, data]) => {
    queryClient.setQueryData(key, data);
  });
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['cart'] });
}
```

**When to use optimistic updates**:
- Cart quantity changes
- Item removal
- Toggle states (favorites, selections)
- Any mutation where immediate feedback improves UX

#### Add Image Loading States

**Problem**: Images pop in suddenly, causing visual jank.

```typescript
// ✅ CORRECT - Fade in after load
const [isLoaded, setIsLoaded] = useState(false);

return (
  <div className="relative overflow-hidden">
    {!isLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
    <img
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
    />
  </div>
);
```

#### Reuse Pre-fetched Data

**Problem**: Fetching the same data multiple times in different functions.

```typescript
// ❌ WRONG - Fetches products again for price calculation
const specials = await getSpecials();
for (const special of specials) {
  const price = await calculateSpecialPrice(special.id); // Fetches products again!
}

// ✅ CORRECT - Reuse already-fetched products
const [products, specials] = await Promise.all([
  getAllProductsWithDetails(),
  getSpecials()
]);
const productsMap = new Map(products.map(p => [p.id, p]));
const prices = calculateSpecialPricesBatch(specials, productsMap); // No additional queries
```

**Key files with these patterns**:
- `lib/api.ts` - `getCartItems()` uses batched fetching
- `lib/api.ts` - `calculateSpecialOriginalPricesBatch()` reuses product data
- `lib/queries/cart.ts` - Optimistic updates for cart mutations
- `components/Image.tsx` - Loading state with fade-in
- `components/ProductCard.tsx` - Memoized for list rendering
- `components/HomePageSkeleton.tsx` - Skeleton loader example

---

This project uses Supabase for all database operations. The codebase is clean, well-structured, and follows modern React/Next.js best practices.
