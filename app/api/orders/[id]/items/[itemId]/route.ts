import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { updateOrderLineItem, removeOrderLineItem } from '@/lib/api';

/**
 * PATCH /api/orders/[id]/items/[itemId] - Update a line item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id, itemId } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const updates = await request.json();

    const updatedOrder = await updateOrderLineItem(
      orderId,
      itemId,
      updates,
      admin.id
    );

    return NextResponse.json({ order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating order line item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update line item' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/orders/[id]/items/[itemId] - Remove a line item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id, itemId } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const updatedOrder = await removeOrderLineItem(
      orderId,
      itemId,
      admin.id
    );

    return NextResponse.json({ order: updatedOrder });
  } catch (error: any) {
    console.error('Error removing order line item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove line item' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
