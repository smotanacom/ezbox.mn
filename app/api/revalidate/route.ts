import { NextRequest, NextResponse } from 'next/server';
import { clearCache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/secret token for security
    const authHeader = request.headers.get('authorization');
    const secret = process.env.REVALIDATE_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear all cache or specific key
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      clearCache(key);
      return NextResponse.json({
        message: `Cache cleared for key: ${key}`,
        timestamp: new Date().toISOString(),
      });
    } else {
      clearCache();
      return NextResponse.json({
        message: 'All cache cleared',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}

// Also support GET for convenience in development
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'GET not allowed in production' }, { status: 405 });
  }

  return POST(request);
}
