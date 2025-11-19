# Tailwind CSS Guide - EzBox.mn

This project uses **Tailwind CSS v4** for all styling. No custom CSS needed!

## Current Tailwind Implementation

### ✅ What's Already Using Tailwind

All components are styled with Tailwind utility classes:

- **Layout & Containers**: `max-w-7xl mx-auto px-4 py-8`
- **Responsive Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Colors**: `bg-gray-50 text-gray-900 bg-blue-600`
- **Typography**: `text-3xl font-bold text-xl`
- **Spacing**: `px-4 py-2 mb-6 gap-4`
- **Shadows**: `shadow-sm shadow-md shadow-lg`
- **Borders**: `border border-gray-200 rounded-lg`
- **Hover States**: `hover:bg-blue-700 hover:shadow-lg`
- **Transitions**: `transition duration-200`
- **Flexbox**: `flex justify-between items-center gap-4`

## Tailwind Classes Used by Component

### Home Page (`app/page.tsx`)

**Layout:**
```tsx
className="min-h-screen bg-gray-50"  // Full height, light gray background
className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8"  // Container with responsive padding
```

**Header:**
```tsx
className="bg-white shadow-sm border-b"  // White background, subtle shadow, bottom border
className="flex justify-between items-center"  // Flexbox layout
className="text-3xl font-bold text-gray-900"  // Large, bold text
```

**Buttons:**
```tsx
className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
// Primary button: Blue background, white text, rounded corners, hover effect
```

**Grid Layout:**
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
// Responsive grid: 1 column mobile, 2 tablet, 3 desktop
```

**Cards:**
```tsx
className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
// White card with rounded corners, shadow that grows on hover
```

### Products Page (`app/products/page.tsx`)

**Tables:**
```tsx
className="min-w-full divide-y divide-gray-200"  // Full width table with dividers
className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"  // Table headers
className="px-6 py-4"  // Table cells
className="hover:bg-gray-50"  // Row hover effect
```

**Form Inputs:**
```tsx
className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
// Input with border, rounded corners, focus ring effect
```

**Dropdowns:**
```tsx
<select className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
```

**Interactive Buttons:**
```tsx
className="px-3 py-2 text-sm rounded text-left transition bg-gray-100 text-gray-700 hover:bg-gray-200"
// Secondary button style with smooth transition
```

**Selected State:**
```tsx
className={selectedCategoryId === cat.id
  ? 'bg-blue-600 text-white'  // Selected: Blue background, white text
  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'  // Not selected: Gray with hover
}
```

### Cart Page (`app/cart/page.tsx`)

**Empty State:**
```tsx
className="bg-white rounded-lg shadow p-12 text-center"
className="text-xl text-gray-600 mb-6"
```

**Table Footer:**
```tsx
className="bg-gray-50"  // Light gray background for totals row
className="text-2xl font-bold text-gray-900"  // Large, bold total price
```

## Color Palette Used

### Grays (Neutral Colors)
- `bg-gray-50` - Very light gray background
- `bg-gray-100` - Light gray for secondary elements
- `bg-gray-200` - Placeholder backgrounds
- `text-gray-400` - Placeholder text
- `text-gray-500` - Secondary text
- `text-gray-600` - Tertiary text
- `text-gray-700` - Regular text
- `text-gray-900` - Primary text (darkest)
- `border-gray-200` - Light borders
- `border-gray-300` - Input borders

### Blues (Primary Actions)
- `bg-blue-600` - Primary button background
- `bg-blue-700` - Primary button hover
- `text-blue-600` - Links
- `ring-blue-500` - Focus rings

### Greens (Success/Special Offers)
- `bg-green-600` - Success buttons
- `bg-green-700` - Success button hover
- `text-green-600` - Special prices

### Reds (Danger/Remove)
- `text-red-600` - Delete/Remove actions
- `text-red-800` - Delete hover

## Responsive Breakpoints

Tailwind breakpoints used in the project:

```tsx
// Mobile first approach
className="grid-cols-1"           // Mobile (< 640px)
className="sm:px-6"               // Small (≥ 640px)
className="md:grid-cols-2"        // Medium (≥ 768px)
className="lg:grid-cols-3"        // Large (≥ 1024px)
className="lg:px-8"               // Large (≥ 1024px)
```

## Common Patterns

### Container Pattern
```tsx
<div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Card Pattern
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  {/* Card content */}
</div>
```

### Primary Button Pattern
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
  Click Me
</button>
```

### Secondary Button Pattern
```tsx
<button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition">
  Cancel
</button>
```

### Success Button Pattern
```tsx
<button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
  Confirm
</button>
```

### Input Pattern
```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
```

### Select Pattern
```tsx
<select className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
  <option>Option 1</option>
</select>
```

## Hover & Transition Effects

All interactive elements use smooth transitions:

```tsx
className="transition"                    // Default transition
className="hover:bg-blue-700"            // Background color change
className="hover:shadow-lg"              // Shadow increase
className="hover:text-blue-800"          // Text color change
```

## Focus States

All form inputs have accessible focus states:

```tsx
className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
```

This creates a blue ring around the element when focused.

## Custom Tailwind Configuration

Currently using default Tailwind with no custom extensions in `tailwind.config.ts`.

To add custom colors or extend the theme:

```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      'brand-blue': '#1E40AF',
      'brand-green': '#059669',
    },
    spacing: {
      '128': '32rem',
    },
  },
},
```

## Adding New Components

When creating new components, follow these patterns:

### Page Layout
```tsx
<div className="min-h-screen bg-gray-50">
  <header className="bg-white shadow-sm border-b">
    {/* Header content */}
  </header>

  <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
    {/* Main content */}
  </main>
</div>
```

### Section with Title
```tsx
<section className="mb-12">
  <h2 className="text-2xl font-bold text-gray-900 mb-6">Section Title</h2>
  {/* Section content */}
</section>
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
      {/* Item content */}
    </div>
  ))}
</div>
```

## No Custom CSS Needed!

The entire application is styled using only Tailwind utility classes. There's no need to write custom CSS files.

## Tailwind IntelliSense

For the best development experience, install the Tailwind CSS IntelliSense extension in VS Code:

1. Open VS Code
2. Search for "Tailwind CSS IntelliSense"
3. Install the extension

This provides:
- Autocomplete for class names
- Linting and warnings
- Hover previews of CSS
- Syntax highlighting

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)
- [Tailwind Play (Online Editor)](https://play.tailwindcss.com/)
