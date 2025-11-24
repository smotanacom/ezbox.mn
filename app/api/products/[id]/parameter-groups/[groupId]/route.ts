import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { removeParameterGroupFromProduct } from '@/lib/api';
import { clearCache } from '@/lib/cache';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    await requireAdmin();

    const { id, groupId } = await params;
    const productId = parseInt(id);
    const parameterGroupId = parseInt(groupId);

    if (isNaN(productId) || isNaN(parameterGroupId)) {
      return NextResponse.json(
        { error: 'Invalid product ID or parameter group ID' },
        { status: 400 }
      );
    }

    await removeParameterGroupFromProduct(productId, parameterGroupId);

    // Clear caches
    clearCache('products-data');
    clearCache('products-data-all');

    return NextResponse.json({
      message: 'Parameter group removed from product successfully',
    });
  } catch (error: any) {
    console.error('Error removing parameter group from product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove parameter group from product' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
