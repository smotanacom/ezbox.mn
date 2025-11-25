import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { addItemToSpecial } from '@/lib/api';
import type { ParameterSelection } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin();

    const specialId = parseInt(params.id);
    if (isNaN(specialId)) {
      return NextResponse.json(
        { error: 'Invalid special ID' },
        { status: 400 }
      );
    }

    const { productId, quantity, selectedParameters } = await request.json();

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required' },
        { status: 400 }
      );
    }

    const item = await addItemToSpecial(
      specialId,
      productId,
      quantity,
      selectedParameters as ParameterSelection
    );

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('Error adding item to special:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to add item to special' },
      { status: 500 }
    );
  }
}
