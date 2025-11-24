import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCart, addToCart, getCartItems, calculateCartTotal } from '@/lib/api';

// Helper to return cart response
async function getCartResponse(cartId: number) {
  const [items, total] = await Promise.all([
    getCartItems(cartId),
    calculateCartTotal(cartId),
  ]);

  return {
    cart: { id: cartId } as any, // Cart object is implied
    items,
    total,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { productId, quantity, selectedParameters, userId, sessionId } = await request.json();

    if (!productId || !quantity || !selectedParameters) {
      return NextResponse.json(
        { error: 'Product ID, quantity, and selected parameters are required' },
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

    // Add item to cart
    await addToCart(cart.id, productId, quantity, selectedParameters);

    // Return updated cart
    const cartResponse = await getCartResponse(cart.id);

    return NextResponse.json(cartResponse);
  } catch (error: any) {
    console.error('Error adding item to cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}
