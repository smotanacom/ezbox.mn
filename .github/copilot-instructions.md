# Copilot Instructions for ezbox.mn

## Project Overview
- **Type:** React + TypeScript e-commerce demo, bootstrapped with Create React App
- **Main features:** Product catalog, cart, checkout, order history, and product specials
- **State management:** [zustand](https://github.com/pmndrs/zustand) with localStorage persistence for cart and orders
- **UI:** Material-UI (MUI) components

## Key Architectural Patterns
- **Products** are defined in `src/data/products.ts` and typed by `src/types/Product.ts`.
- **State** is managed via zustand stores in `src/store/` (`cartStore.ts`, `orderStore.ts`).
- **Product logic** (fetch, search, filter) is encapsulated in the `useProducts` hook (`src/hooks/useProducts.ts`).
- **UI components** are in `src/components/`, with one file per major view (e.g., `HomePage.tsx`, `ProductPage.tsx`, `Cart.tsx`, `Checkout.tsx`).
- **Navigation** uses `react-router-dom` (see usage of `useNavigate`, `useParams`).

## Developer Workflows
- **Start dev server:** `npm start` (runs on http://localhost:3000)
- **Run tests:** `npm test` (Jest, see `App.test.tsx`)
- **Build for production:** `npm run build`
- **No custom scripts** beyond Create React App defaults

## Project-Specific Conventions
- **Product variants**: Each product can have multiple dimensions (e.g., color, configuration) and variants, modeled as arrays in the product object.
- **Cart item IDs**: Uniquely generated from product ID + selected dimensions (see `generateCartItemId` in `cartStore.ts`).
- **Order storage**: Orders are stored in zustand and persisted to localStorage.
- **Image fallback**: Product images use a placeholder on error (`ProductCard.tsx`).
- **Specials**: Products with a `specialPrice` are considered "specials" and surfaced in the UI (`Specials.tsx`).

## Integration Points
- **No backend/API**: All data is local/static.
- **No authentication**: All features are client-side only.
- **No external payment integration**: Checkout is a demo flow only.

## Examples
- **Add to cart:** See `ProductPage.tsx` and `AddToCartModal.tsx` for how products/variants are added to the cart.
- **Order creation:** See `Checkout.tsx` for how orders are created and stored.
- **Product search/filter:** See `useProducts.ts` for search and category filtering logic.

## When in Doubt
- Reference the `README.md` for basic scripts and Create React App conventions.
- Follow the patterns in `src/components/` for UI and state usage.
- Use types from `src/types/Product.ts` for all product/cart/order data.
