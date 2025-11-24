import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyPassword, hashPassword } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    const { error } = await supabase
      .from('users')
      // @ts-expect-error - Supabase type inference issue with update
      .update({ password_hash: newPasswordHash })
      .eq('id', user.id);

    if (error) {
      throw new Error('Failed to update password');
    }

    return NextResponse.json({
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update password' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
