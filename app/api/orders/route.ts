import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin, getCurrentUser, getCurrentAdmin } from '@/lib/auth-server';
import { getUserOrders, getAllOrders } from '@/lib/api';
import { createOrder as createOrderAction } from '@/app/actions/orders';

export async function GET() {
  try {
    // Check if user or admin is logged in
    const admin = await getCurrentAdmin();
    if (admin) {
      // Admin can see all orders
      const orders = await getAllOrders();
      return NextResponse.json({ orders });
    }

    const user = await getCurrentUser();
    if (user) {
      // User can only see their own orders
      const orders = await getUserOrders(user.id);
      return NextResponse.json({ orders });
    }

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cartId, userId, name, address, phone, secondaryPhone } = await request.json();

    if (!cartId || !name || !address || !phone) {
      return NextResponse.json(
        { error: 'Cart ID, name, address, and phone are required' },
        { status: 400 }
      );
    }

    // Use the server action to create order (handles email sending)
    const order = await createOrderAction(cartId, userId || null, name, phone, address, secondaryPhone);

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
