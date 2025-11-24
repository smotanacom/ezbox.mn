import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/auth-server';

export async function POST() {
  try {
    await clearAdminCookie();

    return NextResponse.json({
      message: 'Admin logout successful',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
