import { NextRequest, NextResponse } from 'next/server';
import { getUserByPhone } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if user exists with this phone number
    const user = await getUserByPhone(phone);

    return NextResponse.json({
      exists: !!user,
      // Don't return user data for privacy
    });
  } catch (error: any) {
    console.error('Error checking phone:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check phone number' },
      { status: 500 }
    );
  }
}
