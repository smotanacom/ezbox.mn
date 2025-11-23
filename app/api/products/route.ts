import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCached, setCache } from '@/lib/cache';
import { getAllProductsWithDetails } from '@/lib/api';

// Cache for 5 minutes (300 seconds)
export const revalidate = 300;

const CACHE_KEY = 'products-data';
const CACHE_KEY_ALL = 'products-data-all';

export async function GET(request: NextRequest) {
  try {
    // Check if we should include inactive products
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const cacheKey = includeInactive ? CACHE_KEY_ALL : CACHE_KEY;

    // Check if cache is still valid
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch all products with full details
    // This will use the internal DB query since we're on the server
    const products = await getAllProductsWithDetails(includeInactive);

    // Cache the data
    const data = { products };
    setCache(cacheKey, data);

    // Return with cache headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error fetching products data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch products', details: errorMessage },
      { status: 500 }
    );
  }
}
