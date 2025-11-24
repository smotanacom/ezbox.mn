# Frontend Update Guide

This guide shows how to update the remaining pages to use the new API client.

## Pattern Examples

### 1. Authentication Pages

#### Before (login/page.tsx):
```typescript
import { login, saveSession } from '@/lib/auth';

const handleLogin = async () => {
  const user = await login(phone, password);
  saveSession(user);
  router.push('/');
};
```

#### After:
```typescript
import { useAuth } from '@/hooks/useAuth';

const { login } = useAuth();

const handleLogin = async () => {
  await login(phone, password); // Automatically sets httpOnly cookie
  router.push('/');
};
```

### 2. Pages with User Data

#### Before (account/page.tsx):
```typescript
import { getCurrentUser, updateUserProfile } from '@/lib/auth';

const user = getCurrentUser();
await updateUserProfile(userId, { address });
```

#### After:
```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, updateProfile } = useAuth();
await updateProfile({ address });
```

### 3. Pages with Orders

#### Before (orders/page.tsx):
```typescript
import { getUserOrders } from '@/lib/api';

const orders = await getUserOrders(userId);
```

#### After:
```typescript
import { orderAPI } from '@/lib/api-client';

const { orders } = await orderAPI.getAll(); // Auth from cookie
```

### 4. Admin Pages

#### Before (admin/products/page.tsx):
```typescript
import { getAllProductsWithDetails, getCategories } from '@/lib/api';

const products = await getAllProductsWithDetails(true);
const categories = await getCategories();
```

#### After:
```typescript
import { productAPI, categoryAPI } from '@/lib/api-client';
import { useAdminAuth } from '@/hooks/useAuth';

const { admin } = useAdminAuth();
if (!admin) router.push('/admin/login');

const { products } = await productAPI.getAll(true);
const { categories } = await categoryAPI.getAll();
```

## Quick Reference: Import Replacements

### Remove these imports:
```typescript
// OLD - Remove all of these:
import { getCurrentUser, login, register, logout, updateUserProfile } from '@/lib/auth';
import {
  getProducts,
  getProductWithDetails,
  getUserOrders,
  createProduct,
  updateProduct
} from '@/lib/api';
```

### Add these imports:
```typescript
// NEW - Use these instead:
import { useAuth, useAdminAuth } from '@/hooks/useAuth';
import {
  productAPI,
  categoryAPI,
  parameterAPI,
  cartAPI,
  orderAPI,
  specialAPI,
  storageAPI
} from '@/lib/api-client';
```

## Page-by-Page Updates

### Public Pages

#### 1. app/login/page.tsx
```diff
- import { login, saveSession } from '@/lib/auth';
+ import { useAuth } from '@/hooks/useAuth';

- const user = await login(phone, password);
- saveSession(user);
+ const { login } = useAuth();
+ await login(phone, password);
```

#### 2. app/signup/page.tsx
```diff
- import { register, saveSession } from '@/lib/auth';
+ import { useAuth } from '@/hooks/useAuth';

- const user = await register(phone, password);
- saveSession(user);
+ const { register } = useAuth();
+ await register(phone, password);
```

#### 3. app/account/page.tsx
```diff
- import { getCurrentUser, updateUserProfile, changePassword } from '@/lib/auth';
+ import { useAuth } from '@/hooks/useAuth';

- const user = getCurrentUser();
- await updateUserProfile(userId, updates);
- await changePassword(userId, currentPassword, newPassword);
+ const { user, updateProfile, changePassword } = useAuth();
+ await updateProfile(updates);
+ await changePassword(currentPassword, newPassword);
```

#### 4. app/checkout/page.tsx
```diff
- import { getCurrentUser, login, register } from '@/lib/auth';
- import { getUserByPhone, createOrder } from '@/lib/api';
+ import { useAuth } from '@/hooks/useAuth';
+ import { orderAPI } from '@/lib/api-client';

- const user = getCurrentUser();
- const existingUser = await getUserByPhone(phone);
- await createOrder(cartId, address, phone);
+ const { user, login, register } = useAuth();
+ // getUserByPhone not needed - auth handles this
+ await orderAPI.create({ cartId, address, phone });
```

#### 5. app/orders/page.tsx
```diff
- import { getCurrentUser } from '@/lib/auth';
- import { getUserOrders } from '@/lib/api';
+ import { useAuth } from '@/hooks/useAuth';
+ import { orderAPI } from '@/lib/api-client';

- const user = getCurrentUser();
- const orders = await getUserOrders(user.id);
+ const { user } = useAuth();
+ const { orders } = await orderAPI.getAll();
```

#### 6. app/orders/[id]/page.tsx
```diff
- import { getOrderById, getOrderItems } from '@/lib/api';
+ import { orderAPI } from '@/lib/api-client';

- const order = await getOrderById(orderId);
- const items = await getOrderItems(orderId);
+ // Batched! One call gets everything:
+ const { order } = await orderAPI.getById(orderId);
+ // order.items is included automatically
```

### Admin Pages

#### 7. app/admin/products/page.tsx
```diff
- import { getAllProductsWithDetails, getCategories } from '@/lib/api';
+ import { useAdminAuth } from '@/hooks/useAuth';
+ import { productAPI, categoryAPI } from '@/lib/api-client';

+ const { admin } = useAdminAuth();
+ if (!admin) router.push('/admin/login');
+
- const products = await getAllProductsWithDetails(true);
- const categories = await getCategories();
+ const { products } = await productAPI.getAll(true);
+ const { categories } = await categoryAPI.getAll();
```

#### 8. app/admin/products/new/page.tsx
```diff
- import { createProduct, getCategories, getParameterGroups } from '@/lib/api';
+ import { useAdminAuth } from '@/hooks/useAuth';
+ import { productAPI, categoryAPI, parameterAPI } from '@/lib/api-client';

+ const { admin } = useAdminAuth();
- const categories = await getCategories();
- const parameterGroups = await getParameterGroups();
- const product = await createProduct(data);
+ const { categories } = await categoryAPI.getAll();
+ const { parameterGroups } = await parameterAPI.getAllGroups(); // Batched with parameters!
+ const { product } = await productAPI.create(data);
```

#### 9. app/admin/products/[id]/page.tsx
```diff
- import { getProductWithDetails, getProductImages, getProductModel } from '@/lib/api';
+ import { useAdminAuth } from '@/hooks/useAuth';
+ import { productAPI } from '@/lib/api-client';

- const product = await getProductWithDetails(productId);
- const images = await getProductImages(productId);
- const model = await getProductModel(productId);
+ // BATCHED! One call gets everything:
+ const { product, images, model } = await productAPI.getById(productId);
```

#### 10. app/admin/categories/page.tsx
```diff
- import { getCategories, updateCategory, deleteCategory } from '@/lib/api';
+ import { useAdminAuth } from '@/hooks/useAuth';
+ import { categoryAPI } from '@/lib/api-client';

- const categories = await getCategories();
- await updateCategory(id, data);
- await deleteCategory(id);
+ const { categories } = await categoryAPI.getAll();
+ await categoryAPI.update(id, data);
+ await categoryAPI.delete(id);
```

#### 11. app/admin/categories/new/page.tsx
```diff
- import { createCategory } from '@/lib/api';
+ import { useAdminAuth } from '@/hooks/useAuth';
+ import { categoryAPI } from '@/lib/api-client';

- await createCategory(data);
+ await categoryAPI.create(data);
```

#### 12. app/admin/categories/[id]/page.tsx
```diff
- import { getCategories, updateCategory } from '@/lib/api';
+ import { useAdminAuth } from '@/hooks/useAuth';
+ import { categoryAPI } from '@/lib/api-client';

- const category = categories.find(c => c.id === id);
- await updateCategory(id, data);
+ const { category } = await categoryAPI.getById(id);
+ await categoryAPI.update(id, data);
```

#### 13. app/admin/parameter-groups/page.tsx
```diff
- import { getParameterGroups, getParameters, createParameterGroup } from '@/lib/api';
+ import { useAdminAuth } from '@/hooks/useAuth';
+ import { parameterAPI } from '@/lib/api-client';

- const groups = await getParameterGroups();
- const parameters = await getParameters();
- // Then manually combine them...
+ // BATCHED! One call gets everything:
+ const { parameterGroups } = await parameterAPI.getAllGroups();
+ // parameterGroups[i].parameters already included!
```

#### 14. app/admin/orders/page.tsx
```diff
- import { getAllOrders, updateOrderStatus } from '@/lib/api';
+ import { useAdminAuth } from '@/hooks/useAuth';
+ import { orderAPI } from '@/lib/api-client';

- const orders = await getAllOrders();
- await updateOrderStatus(orderId, status);
+ const { orders } = await orderAPI.getAll();
+ await orderAPI.updateStatus(orderId, status);
```

#### 15. app/admin/orders/[id]/page.tsx
```diff
- import { getOrderById, getOrderItems, updateOrder } from '@/lib/api';
+ import { useAdminAuth } from '@/hooks/useAuth';
+ import { orderAPI } from '@/lib/api-client';

- const order = await getOrderById(orderId);
- const items = await getOrderItems(orderId);
+ // BATCHED! One call gets everything:
+ const { order } = await orderAPI.getById(orderId);
+ // order.items already included!
```

#### 16. app/admin/admins/page.tsx
```diff
- import { listAdmins, deleteAdmin } from '@/lib/adminAuth';
+ import { useAdminAuth } from '@/hooks/useAuth';
+ // Note: Admin CRUD APIs not yet created, keep lib/adminAuth for now
+ // OR create admin API endpoints following the same pattern
```

#### 17. app/admin/login/page.tsx
```diff
- import { adminLogin } from '@/lib/adminAuth';
+ import { useAdminAuth } from '@/hooks/useAuth';

- const admin = await adminLogin(username, password);
+ const { login } = useAdminAuth();
+ await login(username, password);
```

## Storage/Upload Components

These already use API routes, but verify they're using the correct endpoints:

- ✅ `components/admin/ImageUpload.tsx` - Uses `/api/upload/image`
- ✅ `components/admin/ModelUpload.tsx` - Uses `/api/upload/model`

For deleting/reordering, update to use `storageAPI`:

```diff
- Direct fetch to /api/images/:id
+ import { storageAPI } from '@/lib/api-client';
+ await storageAPI.deleteImage(imageId);
+ await storageAPI.reorderImages(imageIds);
+ await storageAPI.deleteModel(productId);
```

## Testing After Updates

After updating each page, test:

1. **Does it load without errors?**
2. **Does authentication work?** (check Network tab for auth cookies)
3. **Do mutations work?** (create/update/delete)
4. **Does data display correctly?**

## Common Pitfalls

### 1. Forgetting to use hooks
```typescript
// ❌ Wrong - can't use outside component
const user = await authAPI.getUser();

// ✅ Correct - use hook
const { user } = useAuth();
```

### 2. Forgetting admin auth guard
```typescript
// ❌ Wrong - no auth check
const { products } = await productAPI.getAll();

// ✅ Correct - check admin first
const { admin } = useAdminAuth();
if (!admin) {
  router.push('/admin/login');
  return;
}
const { products } = await productAPI.getAll();
```

### 3. Not using batched responses
```typescript
// ❌ Wrong - multiple calls
const product = await productAPI.getById(id);
const images = await getProductImages(id);
const model = await getProductModel(id);

// ✅ Correct - one batched call
const { product, images, model } = await productAPI.getById(id);
```

## Final Checklist

- [ ] All pages updated to use API client
- [ ] All components updated
- [ ] No imports from `lib/auth.ts` or `lib/api.ts` in client code
- [ ] All pages tested
- [ ] Supabase RLS policies updated (see RLS_POLICIES.md)
- [ ] Production deployment tested

## Next Step: Update RLS Policies

Once all pages are updated and tested, proceed to `RLS_POLICIES.md` to lock down the database.
