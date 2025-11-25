import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { updateSpecialItem, removeItemFromSpecial } from '@/lib/api';
import type { ParameterSelection } from '@/types/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin();

    const itemId = parseInt(params.itemId);
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    const { quantity, selectedParameters } = await request.json();

    const item = await updateSpecialItem(
      itemId,
      quantity,
      selectedParameters as ParameterSelection | undefined
    );

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('Error updating special item:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update special item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin();

    const itemId = parseInt(params.itemId);
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    await removeItemFromSpecial(itemId);

    return NextResponse.json({ message: 'Item removed successfully' });
  } catch (error: any) {
    console.error('Error removing special item:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to remove special item' },
      { status: 500 }
    );
  }
}
