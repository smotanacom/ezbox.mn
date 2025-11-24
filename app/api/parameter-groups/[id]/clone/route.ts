import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { cloneParameterGroup } from '@/lib/api';
import { clearCache } from '@/lib/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const groupId = parseInt(id);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: 'Invalid parameter group ID' },
        { status: 400 }
      );
    }

    const { newName } = await request.json();

    if (!newName) {
      return NextResponse.json(
        { error: 'New name is required' },
        { status: 400 }
      );
    }

    const parameterGroup = await cloneParameterGroup(groupId, newName);

    // Clear caches
    clearCache('products-data');
    clearCache('products-data-all');

    return NextResponse.json({ parameterGroup });
  } catch (error: any) {
    console.error('Error cloning parameter group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clone parameter group' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
