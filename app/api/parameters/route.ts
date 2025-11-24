import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { createParameter } from '@/lib/api';
import { clearCache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { parameterGroupId, ...data } = await request.json();

    if (!parameterGroupId) {
      return NextResponse.json(
        { error: 'Parameter group ID is required' },
        { status: 400 }
      );
    }

    const parameter = await createParameter({
      parameter_group_id: parameterGroupId,
      ...data
    });

    // Clear caches
    clearCache('products-data');
    clearCache('products-data-all');

    return NextResponse.json({ parameter });
  } catch (error: any) {
    console.error('Error creating parameter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create parameter' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
