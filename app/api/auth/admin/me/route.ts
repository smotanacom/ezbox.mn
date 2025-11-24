import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth-server';

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin) {
      return NextResponse.json(
        { admin: null, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({ admin });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get admin' },
      { status: 500 }
    );
  }
}
