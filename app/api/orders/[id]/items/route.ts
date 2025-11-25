import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { addOrderLineItem } from '@/lib/api';

/**
 * POST /api/orders/[id]/items - Add a new line item to an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const item = await request.json();

    // Validate required fields
    if (!item.product_id || !item.product_name || !item.quantity || !item.unit_price) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, product_name, quantity, unit_price' },
        { status: 400 }
      );
    }

    const updatedOrder = await addOrderLineItem(orderId, item, admin.id);

    return NextResponse.json({ order: updatedOrder });
  } catch (error: any) {
    console.error('Error adding order line item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add line item' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
