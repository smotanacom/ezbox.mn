import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth-server';

export async function POST() {
  try {
    await clearAuthCookie();

    return NextResponse.json({
      message: 'Logout successful',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
