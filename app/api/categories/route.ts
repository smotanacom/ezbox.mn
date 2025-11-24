import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { getCategories, createCategory } from '@/lib/api';
import { clearCache } from '@/lib/cache';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const data = await request.json();
    const category = await createCategory(data);

    // Clear caches
    clearCache('home-page-data');

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
