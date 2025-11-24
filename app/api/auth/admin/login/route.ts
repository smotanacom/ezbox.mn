import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, setAdminCookie } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const admin = await authenticateAdmin(username, password);
    await setAdminCookie(admin.id);

    return NextResponse.json({
      admin,
      message: 'Admin login successful',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Admin login failed' },
      { status: 401 }
    );
  }
}
