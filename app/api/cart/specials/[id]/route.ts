import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCart, removeSpecialFromCart, getCartItems, calculateCartTotal } from '@/lib/api';

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const specialId = parseInt(id);

    if (isNaN(specialId)) {
      return NextResponse.json(
        { error: 'Invalid special ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId, sessionId } = body;

    // Get cart
    const cart = await getOrCreateCart(
      userId ? parseInt(userId) : undefined,
      sessionId || undefined
    );

    if (!cart) {
      return NextResponse.json(
        { error: 'Failed to get cart' },
        { status: 500 }
      );
    }

    // Remove special from cart
    await removeSpecialFromCart(cart.id, specialId);

    // Return updated cart
    const cartResponse = await getCartResponse(cart.id);

    return NextResponse.json(cartResponse);
  } catch (error: any) {
    console.error('Error removing special from cart:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove special from cart' },
      { status: 500 }
    );
  }
}
