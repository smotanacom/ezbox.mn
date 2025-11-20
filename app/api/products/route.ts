import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCached, setCache } from '@/lib/cache';

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

    // Fetch everything in parallel
    const [
      { data: products, error: productsError },
      { data: categories, error: categoriesError },
      { data: productParamGroups, error: paramGroupsError },
      { data: parameterGroups, error: pgError },
      { data: parameters, error: paramsError },
    ] = await Promise.all([
      supabase.from('products').select('*').order('id'),
      supabase.from('categories').select('*'),
      supabase.from('product_parameter_groups').select('*'),
      supabase.from('parameter_groups').select('*'),
      supabase.from('parameters').select('*'),
    ]);

    if (productsError) throw productsError;
    if (categoriesError) throw categoriesError;
    if (paramGroupsError) throw paramGroupsError;
    if (pgError) throw pgError;
    if (paramsError) throw paramsError;

    // Cache the data
    const data = {
      products: products || [],
      categories: categories || [],
      productParamGroups: productParamGroups || [],
      parameterGroups: parameterGroups || [],
      parameters: parameters || [],
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
    console.error('Error fetching products data:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
