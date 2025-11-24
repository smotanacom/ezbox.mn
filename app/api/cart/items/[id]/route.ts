import { NextRequest, NextResponse } from 'next/server';
import { updateCartItem, removeFromCart, getCartItems, calculateCartTotal } from '@/lib/api';
import { supabase } from '@/lib/supabase';

// Helper to get cart ID from item ID
async function getCartIdFromItem(itemId: number): Promise<number | null> {
  const { data, error } = await supabase
    .from('product_in_cart')
    .select('cart_id')
    .eq('id', itemId)
    .single() as { data: { cart_id: number } | null; error: any };

  if (error || !data) return null;
  return data.cart_id;
}

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    const updates = await request.json();

    // Get cart ID before updating
    const cartId = await getCartIdFromItem(itemId);
    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Update item
    await updateCartItem(
      itemId,
      updates.quantity,
      updates.selectedParameters
    );

    // Return updated cart
    const cartResponse = await getCartResponse(cartId);

    return NextResponse.json(cartResponse);
  } catch (error: any) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    // Get cart ID before deleting
    const cartId = await getCartIdFromItem(itemId);
    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Remove item
    await removeFromCart(itemId);

    // Return updated cart
    const cartResponse = await getCartResponse(cartId);

    return NextResponse.json(cartResponse);
  } catch (error: any) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}
