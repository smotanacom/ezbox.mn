import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { reorderProductImages } from '@/lib/storage';

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();

    const { productId, imageIds } = await request.json();

    if (!productId || !imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json(
        { error: 'Product ID and image IDs array are required' },
        { status: 400 }
      );
    }

    await reorderProductImages(productId, imageIds);

    return NextResponse.json({
      message: 'Images reordered successfully',
    });
  } catch (error: any) {
    console.error('Error reordering images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reorder images' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
