import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import type { Admin } from '@/types/database';

// GET /api/admins - List all admins
export async function GET() {
  try {
    // Require admin authentication
    await requireAdmin();

    // Fetch all admins using service role
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('username');

    if (error) {
      console.error('Error fetching admins:', error);
      return NextResponse.json(
        { error: 'Failed to fetch admins' },
        { status: 500 }
      );
    }

    return NextResponse.json({ admins: data });
  } catch (error: any) {
    console.error('Error in GET /api/admins:', error);
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

// POST /api/admins - Create a new admin
export async function POST(request: Request) {
  try {
    // Require admin authentication
    await requireAdmin();

    const body = await request.json();
    const { username, password, email } = body;

    // Validate username (alphanumeric, 3-50 chars)
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-50 alphanumeric characters or underscores' },
        { status: 400 }
      );
    }

    // Validate password
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this username already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists (if email provided)
    if (email) {
      const { data: existingEmail } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Admin with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create admin
    const { data, error } = await supabase
      .from('admins')
      .insert({
        username,
        password_hash,
        email: email || null,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      return NextResponse.json(
        { error: 'Failed to create admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({ admin: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admins:', error);
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
