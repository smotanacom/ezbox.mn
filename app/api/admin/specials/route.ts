import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCached, setCache } from '@/lib/cache';
import { getSpecials, calculateSpecialOriginalPrice } from '@/lib/api';
import { requireAdmin } from '@/lib/auth-server';

const CACHE_KEY = 'admin-specials-data';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    // Check for status filter in query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    // Use different cache keys for different statuses
    const cacheKey = status ? `${CACHE_KEY}-${status}` : CACHE_KEY;

    // Check if cache is still valid
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch specials - pass null to get all, or specific status
    const specials = await getSpecials(status || null);

    // Calculate original prices for all specials in parallel
    const specialsWithPrices = await Promise.all(
      specials.map(async (special) => {
        try {
          const original_price = await calculateSpecialOriginalPrice(special.id);
          return { ...special, original_price };
        } catch (error) {
          console.error(`Error calculating original price for special ${special.id}:`, error);
          return { ...special, original_price: 0 };
        }
      })
    );

    // Cache the data
    const data = { specials: specialsWithPrices };
    setCache(cacheKey, data);

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin specials data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch specials' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
