import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getProductsUsingParameterGroup } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const groupId = parseInt(id);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { error: 'Invalid parameter group ID' },
        { status: 400 }
      );
    }

    const products = await getProductsUsingParameterGroup(groupId);

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Error fetching products using parameter group:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
