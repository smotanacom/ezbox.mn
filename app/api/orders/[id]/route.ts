import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getCurrentUser, getCurrentAdmin } from '@/lib/auth-server';
import { getOrderById, getOrderItems, updateOrder, deleteOrder } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Batch order with items
    const [order, items] = await Promise.all([
      getOrderById(orderId),
      getOrderItems(orderId),
    ]);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const admin = await getCurrentAdmin();
    const user = await getCurrentUser();

    if (!admin && (!user || order.user_id !== user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only view your own orders' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      order: {
        ...order,
        items,
      },
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const updates = await request.json();
    const order = await updateOrder(orderId, updates);

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    await deleteOrder(orderId);

    return NextResponse.json({
      message: 'Order deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete order' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
