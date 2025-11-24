import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCart, getCartItems, calculateCartTotal } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    // Get or create cart using lib/api function
    const cart = await getOrCreateCart(
      userId ? parseInt(userId) : undefined,
      sessionId || undefined
    );

    if (!cart) {
      return NextResponse.json({ error: 'Failed to get or create cart' }, { status: 500 });
    }

    // Fetch cart items with all related data using lib/api function
    const items = await getCartItems(cart.id);

    // Calculate total
    const total = await calculateCartTotal(cart.id);

    return NextResponse.json({
      cart,
      items,
      total,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}
