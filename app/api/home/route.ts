import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCached, setCache } from '@/lib/cache';

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

    // Fetch all home page data in parallel
    const [
      { data: categories, error: categoriesError },
      { data: products, error: productsError },
      { data: specials, error: specialsError },
    ] = await Promise.all([
      supabase.from('categories').select('*').order('id'),
      supabase.from('products').select('*').order('id'),
      supabase.from('specials').select('*').eq('status', 'available').order('id'),
    ]);

    if (categoriesError) throw categoriesError;
    if (productsError) throw productsError;
    if (specialsError) throw specialsError;

    // Cache the data
    const data = {
      categories: categories || [],
      products: products || [],
      specials: specials || [],
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
