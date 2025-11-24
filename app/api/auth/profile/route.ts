import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database';

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const updates = await request.json();

    // Validate updates
    const allowedFields = ['address', 'phone'];
    const sanitizedUpdates: any = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    // If phone is being updated, validate format
    if (sanitizedUpdates.phone && !/^\d{8}$/.test(sanitizedUpdates.phone)) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 8 digits' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      // @ts-expect-error - Supabase type inference issue with update
      .update(sanitizedUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to update profile');
    }

    return NextResponse.json({
      user: {
        ...(data as User),
        password_hash: undefined,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
