import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (user) {
      return NextResponse.json({
        user: {
          ...user,
          password_hash: undefined, // Don't send password hash to client
        },
      });
    }

    return NextResponse.json({ user: null });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500 }
    );
  }
}
