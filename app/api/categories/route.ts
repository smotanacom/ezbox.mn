import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { getCategories, createCategory } from '@/lib/api';
import { clearCache } from '@/lib/cache';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(
      { categories },
      {
        headers: {
          // Cache for 1 hour, revalidate in background for 24 hours
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
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
