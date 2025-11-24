import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { addParameterGroupToProduct } from '@/lib/api';
import { clearCache } from '@/lib/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const { parameterGroupId, defaultParameterId } = await request.json();

    await addParameterGroupToProduct(
      productId,
      parameterGroupId,
      defaultParameterId
    );

    // Clear caches
    clearCache('products-data');
    clearCache('products-data-all');

    return NextResponse.json({
      message: 'Parameter group added to product successfully',
    });
  } catch (error: any) {
    console.error('Error adding parameter group to product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add parameter group to product' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
