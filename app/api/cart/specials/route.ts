import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCart, addSpecialToCart, getCartItems, calculateCartTotal } from '@/lib/api';

// Helper to return cart response
async function getCartResponse(cartId: number) {
  const [items, total] = await Promise.all([
    getCartItems(cartId),
    calculateCartTotal(cartId),
  ]);

  return {
    cart: { id: cartId } as any,
    items,
    total,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { specialId, userId, sessionId } = await request.json();

    if (!specialId) {
      return NextResponse.json(
        { error: 'Special ID is required' },
        { status: 400 }
      );
    }

    // Get or create cart
    const cart = await getOrCreateCart(
      userId ? parseInt(userId) : undefined,
      sessionId || undefined
    );

    if (!cart) {
      return NextResponse.json(
        { error: 'Failed to get or create cart' },
        { status: 500 }
      );
    }

    // Add special to cart
    await addSpecialToCart(cart.id, specialId);

    // Return updated cart
    const cartResponse = await getCartResponse(cart.id);

    return NextResponse.json(cartResponse);
  } catch (error: any) {
    console.error('Error adding special to cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add special to cart' },
      { status: 500 }
    );
  }
}
