# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
- **Type:** React + TypeScript e-commerce demo (ezbox.mn - furniture store)
- **Bootstrap:** Create React App
- **State management:** Zustand with localStorage persistence
- **UI framework:** Material-UI (MUI)
- **Routing:** react-router-dom
- **Data source:** Static product data (no backend/API)

## Commands

### Development
```bash
npm start           # Start dev server (localhost:3000, browser auto-open disabled)
npm test            # Run Jest tests in watch mode
npm run build       # Production build (ESLint disabled)
```

### Environment Variables
- `BROWSER=none` - Prevents browser auto-open on start
- `ESLINT_NO_DEV_ERRORS=true` - ESLint warnings don't block dev server
- `DISABLE_ESLINT_PLUGIN=true` - Disables ESLint in production builds

## Architecture

### State Management
- **Zustand stores** in `src/store/`:
  - `cartStore.ts`: Cart state persisted to `ezbox-cart-storage` in localStorage
  - `orderStore.ts`: Order history persisted to `ezbox-order-storage` in localStorage
- **Cart item uniqueness**: Generated via `generateCartItemId(productId, dimensions)` - combines product ID + sorted dimension key-value pairs
- **Persistence**: Only data (not functions) is persisted using zustand's `partialize`

### Product System
- **Product definitions**: Static data in `src/data/products.ts`
- **Type definitions**: `src/types/Product.ts`
- **Product variants**: Multi-dimensional (e.g., color × configuration), each variant has:
  - `dimensionValues`: Selected dimension combination
  - `image`: Variant-specific image
  - `price`: Optional variant price override (falls back to `basePrice`)
  - `inStock`: Availability flag
- **Special pricing**: Products with `specialPrice` field are surfaced in `/specials`
- **Product hook**: `useProducts` (in `src/hooks/useProducts.ts`) provides search and category filtering

### Component Structure
- **One file per view** in `src/components/`:
  - `HomePage.tsx`: Product catalog landing page
  - `Specials.tsx`: Special offers page
  - `ProductPage.tsx`: Product detail with variant selection
  - `AddToCartModal.tsx`: Add to cart flow
  - `Cart.tsx`: Shopping cart view
  - `Checkout.tsx`: Order creation (demo flow, no payment)
  - `OrderList.tsx`: Order history
  - `OrderSuccess.tsx`: Order confirmation
  - `ProductCard.tsx`: Reusable product display component
  - `ProductList.tsx`: Reusable product grid component

### Routing
- `/` - Home page (all products)
- `/specials` - Products with special pricing
- `/product/:productId` - Product detail page
- `/cart` - Shopping cart
- `/checkout` - Checkout flow
- `/orders` - Order history
- `/order/:orderNumber` - Order confirmation (alternative path)
- `/order-success/:orderNumber` - Order confirmation

### Layout & Styling
- **AppBar**: Constrained to `Container maxWidth="lg"` (matches page content width)
- **Theme**: MUI light theme (configured in `App.tsx`)
- **Container consistency**: Most pages use `Container maxWidth="lg"` for consistent width

## Key Patterns

### Cart Operations
- Only in-stock items can be added to cart (enforced in `cartStore.addItem`)
- Quantity updates to ≤0 trigger item removal
- Cart items include denormalized data (product name, image, price) for display without product lookup

### Order Flow
1. User fills cart (`Cart.tsx`)
2. Proceeds to checkout (`Checkout.tsx`)
3. Enters customer info (name, phone, address)
4. Order created with:
   - Auto-generated order number (timestamp-based)
   - Snapshot of cart items (converted to `OrderItem[]`)
   - Customer info
   - Timestamp (`createdAt`)
5. Cart cleared
6. Redirect to order confirmation

### Product Variant Selection
- Users select dimension values (e.g., Color: Blue, Size: Large)
- Selected combination determines:
  - Product image (variant-specific)
  - Price (variant price or base price + special price override)
  - Stock availability
- Cart item ID uniquely identifies product + dimension combination

### Image Handling
- Products have `mainImage` (default) and variants have `image` (override)
- `ProductCard.tsx` includes image error fallback placeholder

## Data Models

### Product
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  specialPrice?: number;      // If set, product appears in specials
  mainImage: string;
  dimensions: Dimension[];    // Available dimensions (e.g., [{name: "Color", options: [...]}])
  variants: ProductVariant[]; // All dimension combinations
  category?: string;
  tags?: string[];
}
```

### CartItem
```typescript
interface CartItem {
  id: string;                           // Generated from productId + dimensions
  productId: string;
  productName: string;
  selectedDimensions: Record<string, string>; // e.g., {Color: "Blue", Size: "Large"}
  quantity: number;
  price: number;                        // Denormalized for display
  image: string;                        // Denormalized for display
  inStock: boolean;
}
```

### Order
```typescript
interface Order {
  orderNumber: string;
  items: OrderItem[];  // Simplified CartItem (no id/inStock)
  total: number;
  customerInfo: { name: string; phone: string; address: string; };
  createdAt: string;
}
```

## Constraints & Limitations
- No backend - all data is client-side
- No authentication/authorization
- No real payment processing (checkout is demo only)
- No product inventory management
- No order fulfillment workflow
- Product data is hardcoded in `src/data/products.ts`
