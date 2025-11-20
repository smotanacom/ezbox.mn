# EzBox.mn Design System

This document defines the visual and structural standards for the EzBox.mn e-commerce platform.

## Core Principles

1. **Consistency** - Use standardized spacing, typography, and component patterns
2. **Clarity** - Clear visual hierarchy and intuitive layouts
3. **Breathing Room** - Generous whitespace prevents cramped feeling
4. **Mobile-First** - Responsive design that works on all screen sizes

## Layout System

### Page Container
All pages should use consistent container patterns:

```tsx
<div className="min-h-screen bg-gray-50">
  <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
    {/* Page content */}
  </main>
</div>
```

**Spacing:**
- Outer padding: `px-4 py-8 sm:px-6 lg:px-8`
- Max width: `max-w-7xl`
- Background: `bg-gray-50` for pages, `bg-white` for cards

### Section Spacing
Use the Tailwind spacing scale consistently:

- **2 (0.5rem / 8px)** - Tight gaps within components
- **4 (1rem / 16px)** - Related items (form fields, button groups)
- **6 (1.5rem / 24px)** - Card internal padding, moderate gaps
- **8 (2rem / 32px)** - Section internal spacing
- **12 (3rem / 48px)** - Between major sections
- **16 (4rem / 64px)** - Between page sections (rare)

**Examples:**
- Form field spacing: `space-y-4`
- Card padding: `p-6`
- Between cards in grid: `gap-6`
- Between page sections: `mb-12`

## Typography

### Heading Scale

```
Page Title:       text-3xl font-bold tracking-tight mb-8
Section Heading:  text-2xl font-bold tracking-tight mb-6
Subsection:       text-xl font-semibold mb-4
Card Title:       text-lg font-semibold
Small Heading:    text-base font-semibold
```

### Body Text

```
Primary:          text-base text-gray-900
Secondary:        text-sm text-gray-600 / text-muted-foreground
Caption:          text-xs text-gray-500
```

### Examples:

```tsx
{/* Page title */}
<h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>

{/* Section heading */}
<h2 className="text-2xl font-bold tracking-tight mb-6">Special Offers</h2>

{/* Card title */}
<CardTitle className="text-lg font-semibold">{product.name}</CardTitle>

{/* Helper text */}
<p className="text-sm text-muted-foreground">Enter your 8-digit phone number</p>
```

## Color System

### Brand Colors
- Primary action: `bg-blue-600 hover:bg-blue-700`
- Success/Add to cart: `bg-green-600 hover:bg-green-700`
- Destructive/Remove: `bg-red-600 hover:bg-red-700` or `variant="destructive"`

### Backgrounds
- Page background: `bg-gray-50`
- Card background: `bg-white`
- Muted background: `bg-gray-100`
- Hover states: `hover:bg-gray-50`

### Text
- Primary: `text-gray-900` or default
- Secondary: `text-gray-600` or `text-muted-foreground`
- Muted: `text-gray-500`
- Links: `text-primary hover:underline`

### Borders
- Default: `border-gray-200` or just `border`
- Hover: `hover:border-primary`
- Focus: `focus:ring-2 focus:ring-primary`

## Component Standards

### Buttons

**Sizes:**
- Large (CTAs): `size="lg"` - Checkout, Submit forms, Primary actions
- Default: No size prop - Standard actions, Navigation
- Small: `size="sm"` - Secondary actions in tables, Compact UIs
- Icon: `size="icon"` - Icon-only buttons

**Variants:**
- Default/Primary: Main actions (blue)
- Outline: Secondary actions
- Ghost: Navigation, subtle actions
- Destructive: Delete, Remove actions

**Examples:**
```tsx
{/* Primary CTA */}
<Button size="lg" className="bg-green-600 hover:bg-green-700">
  Checkout
</Button>

{/* Secondary action */}
<Button variant="outline" size="lg">
  Continue Shopping
</Button>

{/* Table action */}
<Button size="sm" className="bg-green-600 hover:bg-green-700">
  Add to Cart
</Button>

{/* Remove action */}
<Button size="sm" variant="destructive">
  Remove
</Button>
```

### Cards

**Standard card padding:**
```tsx
<Card>
  <CardHeader> {/* Built-in padding */}
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

**Grid layouts:**
```tsx
{/* 3-column responsive grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>...</Card>
</div>
```

### Forms

**Form field spacing:**
```tsx
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="field">Label</Label>
    <Input id="field" />
    <p className="text-sm text-muted-foreground">Helper text</p>
  </div>
</form>
```

**Form groups:**
- Outer spacing: `space-y-4` (between fields)
- Inner spacing: `space-y-2` (label → input → helper)

### Images

**Size standards by context:**

```tsx
{/* Product thumbnail (cart, small preview) */}
<div className="relative w-16 h-16 rounded-md overflow-hidden">
  <Image src={url} alt={name} className="object-cover w-full h-full" />
</div>

{/* Product card image (grid view) */}
<div className="aspect-square relative overflow-hidden">
  <Image src={url} alt={name} className="object-cover w-full h-full" />
</div>

{/* Category selector */}
<div className="relative w-32 h-32 rounded-lg overflow-hidden">
  <Image src={url} alt={name} className="object-cover w-full h-full" />
</div>

{/* Hero/Featured image */}
<div className="aspect-video relative overflow-hidden">
  <Image src={url} alt={name} className="object-cover w-full h-full" />
</div>
```

**Key rules:**
- Never use fixed px dimensions for images in tables (causes squishing)
- Use aspect ratios for responsive scaling
- Thumbnails: `w-16 h-16` (64px)
- Category cards: `w-32 h-32` (128px)
- Product cards: `aspect-square`
- Banners: `aspect-video`

### Tables

**Standard table with proper image sizing:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-48">Product</TableHead>
      <TableHead>Details</TableHead>
      <TableHead className="w-24">Qty</TableHead>
      <TableHead className="w-32">Price</TableHead>
      <TableHead className="w-32">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {/* Thumbnail - fixed small size */}
          <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
            <Image src={url} alt={name} className="object-cover w-full h-full" />
          </div>
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-muted-foreground">
              Base: ₮{price.toLocaleString()}
            </div>
          </div>
        </div>
      </TableCell>
      {/* Other cells */}
    </TableRow>
  </TableBody>
</Table>
```

**Key rules:**
- Product images in tables: `w-16 h-16` max
- Use `flex-shrink-0` on images
- Set explicit widths on action columns
- Wrap content properly for mobile

## Responsive Patterns

### Grid Breakpoints
```tsx
{/* Standard 3-column grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

{/* 2-column layout (sidebar + main) */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <div className="lg:col-span-2">{/* Main */}</div>
  <div className="lg:col-span-1">{/* Sidebar */}</div>
</div>
```

### Flexbox Patterns
```tsx
{/* Button group - stack on mobile */}
<div className="flex flex-col sm:flex-row gap-4">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>

{/* Space between pattern */}
<div className="flex items-center justify-between">
  <h2>Title</h2>
  <Button>Action</Button>
</div>
```

## Loading & Empty States

### Loading State
```tsx
{loading ? (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
) : (
  {/* Content */}
)}
```

### Empty State
```tsx
<Card className="p-12">
  <div className="flex flex-col items-center text-center">
    <ShoppingBag className="h-20 w-20 mb-4 text-muted-foreground opacity-20" />
    <p className="text-xl mb-6 text-muted-foreground">Your cart is empty</p>
    <Button asChild size="lg">
      <Link href="/products">Start Shopping</Link>
    </Button>
  </div>
</Card>
```

## Animation & Transitions

Use subtle transitions for better UX:

```tsx
{/* Hover transitions */}
className="transition-all hover:shadow-lg"
className="transition-colors hover:bg-gray-50"

{/* State transitions */}
className="transition-all duration-300 ease-in-out"
```

## Common Patterns

### Page Header
```tsx
<div className="flex items-center gap-3 mb-8">
  <Icon className="h-8 w-8" />
  <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
</div>
```

### Section with Header & Action
```tsx
<section className="mb-12">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold tracking-tight">Section Title</h2>
    <Badge variant="secondary">Label</Badge>
  </div>
  {/* Section content */}
</section>
```

### Form Error Display
```tsx
{error && (
  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
    <p className="text-sm text-destructive">{error}</p>
  </div>
)}
```

### Price Display
```tsx
{/* Large price (featured) */}
<span className="text-3xl font-bold text-green-600">
  ₮{price.toLocaleString()}
</span>

{/* Regular price */}
<span className="text-lg font-semibold">
  ₮{price.toLocaleString()}
</span>

{/* Small price (secondary) */}
<span className="text-base font-medium text-primary">
  ₮{price.toLocaleString()}
</span>
```

## Quick Reference

### Spacing Scale
- `gap-2` / `space-y-2` - Very tight (within component)
- `gap-4` / `space-y-4` - Related items (form fields)
- `gap-6` / `space-y-6` - Card content, grid gaps
- `mb-8` - After page titles
- `mb-12` - Between page sections

### Common Combinations
```tsx
{/* Page wrapper */}
<div className="min-h-screen bg-gray-50">
  <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

{/* Page title */}
<h1 className="text-3xl font-bold tracking-tight mb-8">

{/* Section heading */}
<h2 className="text-2xl font-bold tracking-tight mb-6">

{/* Card grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

{/* Form */}
<form className="space-y-4">
  <div className="space-y-2">

{/* Button group */}
<div className="flex flex-col sm:flex-row gap-4">
```

## Migration Checklist

When updating existing pages:

- [ ] Use standard page container pattern
- [ ] Apply consistent heading hierarchy
- [ ] Use spacing scale (2, 4, 6, 8, 12)
- [ ] Fix oversized images (especially in tables)
- [ ] Standardize button sizes
- [ ] Apply consistent card padding
- [ ] Use proper responsive breakpoints
- [ ] Add loading/empty states if missing
- [ ] Ensure proper color usage
- [ ] Add hover states and transitions
