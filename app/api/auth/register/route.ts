import { NextRequest, NextResponse } from 'next/server';
import { createUser, setAuthCookie } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone and password are required' },
        { status: 400 }
      );
    }

    const user = await createUser(phone, password);
    await setAuthCookie(user.id);

    return NextResponse.json({
      user: {
        ...user,
        password_hash: undefined, // Don't send password hash to client
      },
      message: 'Registration successful',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
