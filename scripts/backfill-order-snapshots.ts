/**
 * Backfill script to migrate existing orders to use snapshot_data
 *
 * This script:
 * 1. Finds all orders without snapshot_data
 * 2. Builds snapshot from current cart items
 * 3. Updates orders with snapshot
 * 4. Marks as backfilled in metadata
 *
 * Usage: npx ts-node scripts/backfill-order-snapshots.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface OrderItem {
  id: string;
  product_id: number;
  product_name: string;
  product_description: string | null;
  category_name: string | null;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  parameters: Array<{
    group: string;
    name: string;
    value?: string;
  }>;
  special_id?: number;
  special_name?: string;
}

interface OrderSnapshot {
  items: OrderItem[];
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  metadata?: {
    backfilled: boolean;
    backfilled_at: string;
  };
}

async function buildSnapshotFromCart(cartId: number): Promise<OrderSnapshot | null> {
  try {
    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('product_in_cart')
      .select('*')
      .eq('cart_id', cartId);

    if (cartError) throw cartError;
    if (!cartItems || cartItems.length === 0) {
      console.warn(`  No cart items found for cart_id ${cartId}`);
      return null;
    }

    const items: OrderItem[] = [];

    for (const cartItem of cartItems) {
      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .eq('id', cartItem.product_id)
        .single();

      if (productError || !product) {
        console.warn(`  Product ${cartItem.product_id} not found, creating placeholder`);
        // Create placeholder for deleted product
        items.push({
          id: crypto.randomUUID(),
          product_id: cartItem.product_id,
          product_name: `[Deleted Product #${cartItem.product_id}]`,
          product_description: null,
          category_name: null,
          image_url: null,
          quantity: cartItem.quantity,
          unit_price: 0,
          line_total: 0,
          parameters: [],
        });
        continue;
      }

      // Get product images
      const { data: images } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .order('display_order')
        .limit(1);

      const imageUrl = images && images.length > 0
        ? `/api/images/${images[0].id}`
        : null;

      // Build parameters display
      const parameters: Array<{ group: string; name: string; value?: string }> = [];
      let unitPrice = product.base_price;

      if (cartItem.selected_parameters) {
        const selections = cartItem.selected_parameters as Record<string, number>;

        for (const [paramGroupId, paramId] of Object.entries(selections)) {
          // Get parameter group
          const { data: paramGroup } = await supabase
            .from('parameter_groups')
            .select('name')
            .eq('id', parseInt(paramGroupId))
            .single();

          // Get parameter
          const { data: param } = await supabase
            .from('parameters')
            .select('name, description, price_modifier')
            .eq('id', paramId)
            .single();

          if (paramGroup && param) {
            parameters.push({
              group: paramGroup.name,
              name: param.name,
              value: param.description || undefined,
            });
            unitPrice += param.price_modifier;
          }
        }
      }

      const lineTotal = unitPrice * cartItem.quantity;

      items.push({
        id: crypto.randomUUID(),
        product_id: product.id,
        product_name: product.name,
        product_description: product.description,
        category_name: (product as any).category?.name || null,
        image_url: imageUrl,
        quantity: cartItem.quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
        parameters,
        special_id: cartItem.special_id || undefined,
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
    const discount = 0;
    const tax = 0;
    const total = subtotal - discount + tax;

    return {
      items,
      totals: {
        subtotal,
        discount,
        tax,
        total,
      },
      metadata: {
        backfilled: true,
        backfilled_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error(`  Error building snapshot for cart_id ${cartId}:`, error);
    return null;
  }
}

async function backfillOrders() {
  console.log('Starting order snapshot backfill...\n');

  // Get all orders without snapshot_data
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, cart_id, total_price')
    .is('snapshot_data', null)
    .order('id');

  if (error) {
    console.error('Error fetching orders:', error);
    process.exit(1);
  }

  if (!orders || orders.length === 0) {
    console.log('No orders to backfill! All orders already have snapshots.');
    process.exit(0);
  }

  console.log(`Found ${orders.length} orders to backfill\n`);

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (const order of orders) {
    console.log(`Processing order #${order.id}...`);

    if (!order.cart_id) {
      console.warn(`  Skipped: No cart_id`);
      skippedCount++;
      continue;
    }

    const snapshot = await buildSnapshotFromCart(order.cart_id);

    if (!snapshot) {
      console.warn(`  Failed: Could not build snapshot`);
      failCount++;
      continue;
    }

    // Update order with snapshot
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        snapshot_data: snapshot as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error(`  Error updating order:`, updateError);
      failCount++;
      continue;
    }

    // Verify total matches (within rounding)
    const diff = Math.abs(snapshot.totals.total - order.total_price);
    if (diff > 1) {
      console.warn(`  Warning: Total mismatch! Stored: ₮${order.total_price}, Calculated: ₮${snapshot.totals.total}`);
    }

    console.log(`  ✓ Success: ${snapshot.items.length} items, total ₮${snapshot.totals.total}`);
    successCount++;
  }

  console.log('\n=== Backfill Summary ===');
  console.log(`Total orders processed: ${orders.length}`);
  console.log(`✓ Successful: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log(`⊘ Skipped: ${skippedCount}`);
  console.log('========================\n');

  if (failCount > 0) {
    console.warn('Some orders failed to backfill. Check logs above for details.');
    process.exit(1);
  } else {
    console.log('All orders backfilled successfully!');
    process.exit(0);
  }
}

// Run the backfill
backfillOrders().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
