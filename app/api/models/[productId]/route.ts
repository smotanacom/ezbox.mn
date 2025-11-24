import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { deleteProductModel } from '@/lib/storage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    await requireAdmin();

    const { productId } = await params;
    const id = parseInt(productId);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    await deleteProductModel(id);

    return NextResponse.json({
      message: 'Model deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting model:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete model' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
