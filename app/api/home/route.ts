import { NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/cache';
import { getCategories, getAllProductsWithDetails, getSpecials, calculateSpecialOriginalPrice } from '@/lib/api';

// Cache for 5 minutes (300 seconds)
export const revalidate = 300;

const CACHE_KEY = 'home-data';

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

    // Fetch all home page data in parallel using lib/api functions
    const [categories, products, specials] = await Promise.all([
      getCategories(),
      getAllProductsWithDetails(),
      getSpecials('available'),
    ]);

    // Group products by category
    const productsByCategory: Record<number, typeof products> = {};
    for (const product of products) {
      if (product.category_id) {
        if (!productsByCategory[product.category_id]) {
          productsByCategory[product.category_id] = [];
        }
        productsByCategory[product.category_id].push(product);
      }
    }

    // Calculate original prices for all specials in parallel
    const specialOriginalPrices: Record<number, number> = {};
    await Promise.all(
      specials.map(async (special) => {
        try {
          const originalPrice = await calculateSpecialOriginalPrice(special.id);
          specialOriginalPrices[special.id] = originalPrice;
        } catch (error) {
          console.error(`Error calculating original price for special ${special.id}:`, error);
          specialOriginalPrices[special.id] = 0;
        }
      })
    );

    // Cache the data (matching HomePageData interface)
    const data = {
      categories,
      productsByCategory,
      specials,
      specialOriginalPrices,
    };
    setCache(CACHE_KEY, data);

    // Return with cache headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Error fetching home page data:', error);
    return NextResponse.json({ error: 'Failed to fetch home data' }, { status: 500 });
  }
}
