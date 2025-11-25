import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { getHistoryForEntity } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin();

    const entityType = params.entityType;
    const entityId = parseInt(params.entityId);

    if (isNaN(entityId)) {
      return NextResponse.json(
        { error: 'Invalid entity ID' },
        { status: 400 }
      );
    }

    const history = await getHistoryForEntity(entityType, entityId);

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Error fetching history:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
