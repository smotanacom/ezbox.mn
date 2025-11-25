import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setAuthCookie } from '@/lib/auth-server';
import { migrateGuestCartToUser } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const { phone, password, guestSessionId } = await request.json();

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone and password are required' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(phone, password);
    await setAuthCookie(user.id);

    // Migrate guest cart to user cart if guest session ID is provided
    if (guestSessionId) {
      try {
        await migrateGuestCartToUser(user.id, guestSessionId);
      } catch (error) {
        console.error('Failed to migrate guest cart:', error);
        // Don't fail the login if cart migration fails
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        password_hash: undefined, // Don't send password hash to client
      },
      message: 'Login successful',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 401 }
    );
  }
}
