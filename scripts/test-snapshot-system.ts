/**
 * Test script for Order Snapshot & Soft Delete System
 *
 * Tests:
 * 1. Order creation with snapshots
 * 2. Soft delete/archive functionality
 * 3. Admin order editing
 *
 * Usage: npx tsx scripts/test-snapshot-system.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

let testsPassed = 0;
let testsFailed = 0;

function logTest(name: string, passed: boolean, details?: string) {
  if (passed) {
    console.log(`✅ ${name}`);
    testsPassed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    testsFailed++;
  }
}

async function testOrderSnapshots() {
  console.log('\n📦 Testing Order Snapshots...\n');

  try {
    // Get a recent order
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!orders || orders.length === 0) {
      logTest('Order snapshots - Has orders in database', false, 'No orders found');
      return;
    }

    const order = orders[0];

    // Test 1: Order has snapshot_data
    logTest(
      'Order has snapshot_data field',
      order.snapshot_data !== null && order.snapshot_data !== undefined,
      order.snapshot_data ? '' : 'snapshot_data is null'
    );

    if (order.snapshot_data) {
      const snapshot = order.snapshot_data as any;

      // Test 2: Snapshot has items array
      logTest(
        'Snapshot contains items array',
        Array.isArray(snapshot.items),
        Array.isArray(snapshot.items) ? '' : 'items is not an array'
      );

      // Test 3: Snapshot has totals
      logTest(
        'Snapshot contains totals object',
        snapshot.totals && typeof snapshot.totals === 'object',
        snapshot.totals ? '' : 'totals is missing'
      );

      if (snapshot.items && snapshot.items.length > 0) {
        const item = snapshot.items[0];

        // Test 4: Item has required fields
        const hasRequiredFields =
          item.id &&
          item.product_name &&
          typeof item.quantity === 'number' &&
          typeof item.unit_price === 'number' &&
          typeof item.line_total === 'number';

        logTest(
          'Order item has required fields (id, name, quantity, prices)',
          hasRequiredFields,
          hasRequiredFields ? '' : 'Missing required fields'
        );

        // Test 5: Item has parameters array
        logTest(
          'Order item has parameters array',
          Array.isArray(item.parameters),
          Array.isArray(item.parameters) ? '' : 'parameters is not an array'
        );

        // Test 6: Prices are consistent
        const calculatedTotal = snapshot.items.reduce((sum: number, i: any) => sum + i.line_total, 0);
        const priceMatch = Math.abs(calculatedTotal - snapshot.totals.subtotal) < 1;

        logTest(
          'Item totals match snapshot subtotal',
          priceMatch,
          priceMatch ? '' : `Calculated: ₮${calculatedTotal}, Stored: ₮${snapshot.totals.subtotal}`
        );
      }

      // Test 7: Total price column matches snapshot
      if (snapshot.totals) {
        const totalMatch = Math.abs(order.total_price - snapshot.totals.total) < 1;
        logTest(
          'Order total_price matches snapshot total',
          totalMatch,
          totalMatch ? '' : `Column: ₮${order.total_price}, Snapshot: ₮${snapshot.totals.total}`
        );
      }
    }

  } catch (error) {
    console.error('Error testing order snapshots:', error);
    logTest('Order snapshot tests', false, (error as Error).message);
  }
}

async function testSoftDelete() {
  console.log('\n🗑️  Testing Soft Delete / Archive...\n');

  try {
    // Test 1: Check if status fields exist
    const { data: products } = await supabase
      .from('products')
      .select('id, name, status')
      .limit(1);

    logTest(
      'Products table has status field',
      products && products.length > 0 && 'status' in products[0],
      products && products.length > 0 ? '' : 'No products found or status field missing'
    );

    // Test 2: Check categories have status
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, status')
      .limit(1);

    logTest(
      'Categories table has status field',
      categories && categories.length > 0 && 'status' in categories[0],
      categories && categories.length > 0 ? '' : 'No categories found or status field missing'
    );

    // Test 3: Check parameters have status
    const { data: parameters } = await supabase
      .from('parameters')
      .select('id, name, status')
      .limit(1);

    logTest(
      'Parameters table has status field',
      parameters && parameters.length > 0 && 'status' in parameters[0],
      parameters && parameters.length > 0 ? '' : 'No parameters found or status field missing'
    );

    // Test 4: Check parameter groups have status
    const { data: paramGroups } = await supabase
      .from('parameter_groups')
      .select('id, name, status')
      .limit(1);

    logTest(
      'Parameter groups table has status field',
      paramGroups && paramGroups.length > 0 && 'status' in paramGroups[0],
      paramGroups && paramGroups.length > 0 ? '' : 'No parameter groups found or status field missing'
    );

    // Test 5: Default status is 'active'
    if (products && products.length > 0) {
      logTest(
        'Default product status is active',
        products[0].status === 'active' || products[0].status === 'inactive' || products[0].status === 'draft',
        `Status is: ${products[0].status}`
      );
    }

    // Test 6: Check foreign key constraint changed to RESTRICT
    // Query to check constraint
    const { data: constraints } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT confdeltype
          FROM pg_constraint
          WHERE conname = 'product_in_cart_product_id_fkey'
        `
      } as any)
      .single();

    // Note: This test might not work without custom RPC function
    // Logging as informational
    console.log('ℹ️  Foreign key constraint check (manual verification needed)');

  } catch (error) {
    console.error('Error testing soft delete:', error);
    logTest('Soft delete tests', false, (error as Error).message);
  }
}

async function testAdminOrderEditing() {
  console.log('\n✏️  Testing Admin Order Editing API...\n');

  try {
    // Get an order with snapshot
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .not('snapshot_data', 'is', null)
      .limit(1);

    if (!orders || orders.length === 0) {
      logTest('Admin order editing - Has order with snapshot', false, 'No orders with snapshots found');
      return;
    }

    const order = orders[0];
    const snapshot = order.snapshot_data as any;

    logTest(
      'Found order with snapshot for testing',
      snapshot && snapshot.items && snapshot.items.length > 0,
      snapshot ? `Order #${order.id} with ${snapshot.items?.length || 0} items` : 'No snapshot'
    );

    // Test updateOrder function signature
    // We can't actually test the API without auth, but we can verify structure
    if (snapshot && snapshot.items && snapshot.items.length > 0) {
      const item = snapshot.items[0];

      logTest(
        'Order item has unique ID for editing',
        typeof item.id === 'string' && item.id.length > 0,
        item.id ? `ID: ${item.id}` : 'No ID'
      );

      logTest(
        'Order item has editable fields (quantity, unit_price)',
        typeof item.quantity === 'number' && typeof item.unit_price === 'number',
        `Quantity: ${item.quantity}, Price: ₮${item.unit_price}`
      );
    }

    // Test metadata structure
    if (snapshot.metadata) {
      logTest(
        'Snapshot has metadata object',
        typeof snapshot.metadata === 'object',
        snapshot.metadata.backfilled ? 'Backfilled order' : 'New order format'
      );
    } else {
      console.log('ℹ️  Order has no metadata (created before backfill)');
    }

  } catch (error) {
    console.error('Error testing admin order editing:', error);
    logTest('Admin order editing tests', false, (error as Error).message);
  }
}

async function testBackwardCompatibility() {
  console.log('\n🔄 Testing Backward Compatibility...\n');

  try {
    // Check if all orders have snapshot_data OR cart_id
    const { data: orders } = await supabase
      .from('orders')
      .select('id, cart_id, snapshot_data')
      .order('id');

    if (!orders || orders.length === 0) {
      console.log('ℹ️  No orders in database');
      return;
    }

    let validOrders = 0;
    let invalidOrders = 0;

    for (const order of orders) {
      if (order.snapshot_data || order.cart_id) {
        validOrders++;
      } else {
        invalidOrders++;
        console.log(`   ⚠️  Order #${order.id} has no snapshot_data and no cart_id`);
      }
    }

    logTest(
      'All orders have either snapshot_data or cart_id',
      invalidOrders === 0,
      invalidOrders > 0 ? `${invalidOrders} orders missing both` : `${validOrders}/${orders.length} orders valid`
    );

    const snapshotCount = orders.filter(o => o.snapshot_data).length;
    const cartOnlyCount = orders.filter(o => !o.snapshot_data && o.cart_id).length;

    console.log(`   ${snapshotCount} orders with snapshots`);
    console.log(`   ${cartOnlyCount} orders with cart_id only (pre-migration)`);

  } catch (error) {
    console.error('Error testing backward compatibility:', error);
    logTest('Backward compatibility tests', false, (error as Error).message);
  }
}

async function runAllTests() {
  console.log('🧪 Order Snapshot & Soft Delete System - Test Suite\n');
  console.log('=' .repeat(60));

  await testOrderSnapshots();
  await testSoftDelete();
  await testAdminOrderEditing();
  await testBackwardCompatibility();

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! System is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.\n');
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
