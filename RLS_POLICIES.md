# Supabase RLS Policies - Lock Down Database

## Overview

After completing the frontend migration to use API endpoints, we need to **completely restrict direct database access from the client**.

**CRITICAL:** Only apply these policies AFTER all frontend pages are updated and tested!

## Current State (Before)
- ✅ Frontend code makes direct queries to Supabase
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` exposed in client
- ✅ RLS policies allow `anon` role to read/write

## Target State (After)
- ❌ Frontend CANNOT access database directly
- ✅ Only API routes can access database (via service role key)
- ✅ `anon` role has NO permissions
- ✅ `authenticated` role has NO permissions

## Step 1: Verify API Routes Work

Before locking down, test that ALL functionality works through API routes:

```bash
# Test user flows
- Browse products (/api/products)
- Add to cart (/api/cart/items)
- Login (/api/auth/login)
- Create order (/api/orders)

# Test admin flows
- Admin login (/api/auth/admin/login)
- Create product (/api/products)
- Update order status (/api/orders/:id/status)
```

## Step 2: Drop Existing RLS Policies

First, remove all existing RLS policies that allow public access:

```sql
-- Find all existing policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Drop policies (replace with actual policy names from above query)
DROP POLICY IF EXISTS "policy_name" ON table_name;

-- Or drop ALL policies on each table:
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "Enable read access for all users" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Enable insert for all users" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Enable update for all users" ON ' || r.tablename;
    EXECUTE 'DROP POLICY IF EXISTS "Enable delete for all users" ON ' || r.tablename;
  END LOOP;
END $$;
```

## Step 3: Revoke All Public Permissions

Revoke ALL permissions from `anon` and `authenticated` roles:

```sql
-- Revoke from anon role (public, unauthenticated users)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Revoke from authenticated role (logged-in users via Supabase Auth)
-- Note: We're not using Supabase Auth, so this is just for safety
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
```

## Step 4: Verify Service Role Access

Ensure service role (used by API routes) still has full access:

```sql
-- Service role should have full permissions
-- This is set by default, but verify:
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
```

## Step 5: Enable RLS on All Tables

Enable Row Level Security on every table (if not already enabled):

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameter_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_parameter_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_in_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_models ENABLE ROW LEVEL SECURITY;
```

## Step 6: Create NO-ACCESS Policies

Create explicit DENY policies for `anon` and `authenticated` roles:

```sql
-- Helper function to create deny-all policies for a table
CREATE OR REPLACE FUNCTION create_deny_all_policies(table_name TEXT)
RETURNS void AS $$
BEGIN
  -- Deny all SELECT
  EXECUTE format('
    CREATE POLICY "Deny all SELECT for anon" ON %I
    FOR SELECT TO anon
    USING (false);
  ', table_name);

  EXECUTE format('
    CREATE POLICY "Deny all SELECT for authenticated" ON %I
    FOR SELECT TO authenticated
    USING (false);
  ', table_name);

  -- Deny all INSERT
  EXECUTE format('
    CREATE POLICY "Deny all INSERT for anon" ON %I
    FOR INSERT TO anon
    WITH CHECK (false);
  ', table_name);

  EXECUTE format('
    CREATE POLICY "Deny all INSERT for authenticated" ON %I
    FOR INSERT TO authenticated
    WITH CHECK (false);
  ', table_name);

  -- Deny all UPDATE
  EXECUTE format('
    CREATE POLICY "Deny all UPDATE for anon" ON %I
    FOR UPDATE TO anon
    USING (false);
  ', table_name);

  EXECUTE format('
    CREATE POLICY "Deny all UPDATE for authenticated" ON %I
    FOR UPDATE TO authenticated
    USING (false);
  ', table_name);

  -- Deny all DELETE
  EXECUTE format('
    CREATE POLICY "Deny all DELETE for anon" ON %I
    FOR DELETE TO anon
    USING (false);
  ', table_name);

  EXECUTE format('
    CREATE POLICY "Deny all DELETE for authenticated" ON %I
    FOR DELETE TO authenticated
    USING (false);
  ', table_name);
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
SELECT create_deny_all_policies('users');
SELECT create_deny_all_policies('admins');
SELECT create_deny_all_policies('categories');
SELECT create_deny_all_policies('products');
SELECT create_deny_all_policies('parameter_groups');
SELECT create_deny_all_policies('parameters');
SELECT create_deny_all_policies('product_parameter_groups');
SELECT create_deny_all_policies('carts');
SELECT create_deny_all_policies('product_in_cart');
SELECT create_deny_all_policies('orders');
SELECT create_deny_all_policies('specials');
SELECT create_deny_all_policies('special_items');
SELECT create_deny_all_policies('product_images');
SELECT create_deny_all_policies('product_models');
```

## Step 7: Lock Down Storage Buckets

Lock down Supabase Storage buckets:

```sql
-- Product images bucket
DROP POLICY IF EXISTS "Public access for product images" ON storage.objects;

CREATE POLICY "Deny public upload" ON storage.objects
FOR INSERT TO anon
WITH CHECK (false);

CREATE POLICY "Deny public delete" ON storage.objects
FOR DELETE TO anon
USING (false);

-- Only service role can upload/delete (API routes)
-- Public can still READ (for displaying images)
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id IN ('product-images', 'product-models'));
```

## Step 8: Verify Lockdown

Test that direct database access from client is blocked:

```javascript
// This should FAIL (in browser console):
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
);

const { data, error } = await supabase
  .from('products')
  .select('*');

console.log(error); // Should show permission denied
```

Test that API routes still work:

```bash
# This should SUCCEED:
curl http://localhost:3000/api/products
```

## Step 9: Update Environment Variables (Optional)

Optionally remove the anon key from client env:

```env
# .env.local - Server-side only
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Don't set NEXT_PUBLIC_SUPABASE_ANON_KEY
# Or if you must keep it, just don't use it in client code
```

Update `lib/supabase.ts`:

```typescript
// Server-side only (API routes)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Client - remove or don't export
// export const supabaseClient = createClient(...); <- DELETE THIS
```

## Migration Checklist

Before applying RLS policies:

- [ ] All API routes created and tested
- [ ] All frontend pages updated to use API client
- [ ] CartContext updated
- [ ] Auth hooks updated
- [ ] No errors in browser console
- [ ] All user flows work (browse, cart, checkout, login)
- [ ] All admin flows work (CRUD products, orders, etc.)

After applying RLS policies:

- [ ] Direct Supabase queries from client fail
- [ ] API routes still work
- [ ] Test all user flows again
- [ ] Test all admin flows again
- [ ] Images still load (public read access)
- [ ] Image upload works (via API route)

## Rollback Plan

If something breaks after applying RLS:

```sql
-- Quick rollback: Grant all permissions back
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Then debug the issue before re-applying lockdown
```

## Security Best Practices

1. **Never expose service role key to client**
   - Only use in server-side code (API routes)
   - Never in client environment variables

2. **Rate limiting**
   - Add rate limiting to API routes (consider using Vercel's edge config or Upstash Redis)

3. **CORS**
   - Configure allowed origins in production

4. **Monitoring**
   - Monitor API route usage
   - Set up alerts for unusual activity

5. **Audit logs**
   - Consider logging all admin actions
   - Track order creation, product changes, etc.

## Done!

Your database is now secure:
- ✅ No direct client access to database
- ✅ All queries go through API routes with authentication
- ✅ HttpOnly cookies prevent XSS attacks
- ✅ Service role key never exposed to client
- ✅ Row Level Security enabled on all tables
- ✅ Defense in depth strategy
