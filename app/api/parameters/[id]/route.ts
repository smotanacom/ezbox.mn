import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { updateParameter, deleteParameter } from '@/lib/api';
import { clearCache } from '@/lib/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const parameterId = parseInt(id);

    if (isNaN(parameterId)) {
      return NextResponse.json(
        { error: 'Invalid parameter ID' },
        { status: 400 }
      );
    }

    const updates = await request.json();
    const parameter = await updateParameter(parameterId, updates);

    // Clear caches
    clearCache('products-data');
    clearCache('products-data-all');

    return NextResponse.json({ parameter });
  } catch (error: any) {
    console.error('Error updating parameter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update parameter' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const parameterId = parseInt(id);

    if (isNaN(parameterId)) {
      return NextResponse.json(
        { error: 'Invalid parameter ID' },
        { status: 400 }
      );
    }

    await deleteParameter(parameterId);

    // Clear caches
    clearCache('products-data');
    clearCache('products-data-all');

    return NextResponse.json({
      message: 'Parameter deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting parameter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete parameter' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
