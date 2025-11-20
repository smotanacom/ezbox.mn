import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/cache';
import { getAllProductsWithDetails } from '@/lib/api';

// Cache for 5 minutes (300 seconds)
export const revalidate = 300;

const CACHE_KEY = 'products-data';

export async function GET() {
  try {
    // Check if cache is still valid
    const cachedData = getCached(CACHE_KEY);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch all products with full details using lib/api function
    const products = await getAllProductsWithDetails();

    // Cache the data
    const data = { products };
    setCache(CACHE_KEY, data);

    // Return with cache headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error fetching products data:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
