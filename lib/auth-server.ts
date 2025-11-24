/**
 * Server-side Authentication Utilities
 *
 * Handles httpOnly cookies, password hashing, and user verification.
 * Only runs on the server (API routes).
 */

import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { supabase } from './supabase';
import type { User, Admin } from '@/types/database';

const COOKIE_NAME = 'auth_token';
const ADMIN_COOKIE_NAME = 'admin_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// ==================== PASSWORD HASHING ====================

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ==================== COOKIE MANAGEMENT ====================

export async function setAuthCookie(userId: number): Promise<void> {
  const cookieStore = await cookies();

  // Simple token: just the user ID (in production, use JWT or similar)
  const token = Buffer.from(JSON.stringify({ userId, type: 'user' })).toString('base64');

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function setAdminCookie(adminId: number): Promise<void> {
  const cookieStore = await cookies();

  const token = Buffer.from(JSON.stringify({ adminId, type: 'admin' })).toString('base64');

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function clearAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function getUserIdFromCookie(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);

  if (!token) return null;

  try {
    const decoded = JSON.parse(Buffer.from(token.value, 'base64').toString());
    return decoded.userId || null;
  } catch {
    return null;
  }
}

export async function getAdminIdFromCookie(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME);

  if (!token) return null;

  try {
    const decoded = JSON.parse(Buffer.from(token.value, 'base64').toString());
    return decoded.adminId || null;
  } catch {
    return null;
  }
}

// ==================== USER VERIFICATION ====================

export async function getCurrentUser(): Promise<User | null> {
  const userId = await getUserIdFromCookie();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single() as { data: User | null; error: any };

  if (error || !data) return null;
  return data as User;
}

export async function getCurrentAdmin(): Promise<{ id: number; username: string; created_at: string } | null> {
  const adminId = await getAdminIdFromCookie();
  if (!adminId) return null;

  const { data, error } = await supabase
    .from('admins')
    .select('id, username, created_at')
    .eq('id', adminId)
    .single() as { data: { id: number; username: string; created_at: string } | null; error: any };

  if (error || !data) return null;
  return data as { id: number; username: string; created_at: string };
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin(): Promise<{ id: number; username: string; created_at: string }> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error('Unauthorized - Admin access required');
  }
  return admin;
}

// ==================== USER OPERATIONS ====================

export async function createUser(phone: string, password: string): Promise<User> {
  // Validate phone (8 digits)
  if (!/^\d{8}$/.test(phone)) {
    throw new Error('Phone number must be exactly 8 digits');
  }

  // Check if user exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .single() as { data: { id: number } | null; error: any };

  if (existing) {
    throw new Error('User with this phone number already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const { data, error } = await supabase
    .from('users')
    .insert({
      phone,
      password_hash: passwordHash,
      is_admin: false,
    } as any)
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to create user');
  }

  return data as User;
}

export async function authenticateUser(phone: string, password: string): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single() as { data: User | null; error: any };

  if (error || !user) {
    throw new Error('Invalid phone or password');
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid phone or password');
  }

  return user as User;
}

export async function authenticateAdmin(username: string, password: string): Promise<{ id: number; username: string; created_at: string }> {
  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('username', username)
    .single() as { data: Admin | null; error: any };

  if (error || !admin) {
    throw new Error('Invalid username or password');
  }

  const isValid = await verifyPassword(password, admin.password_hash);
  if (!isValid) {
    throw new Error('Invalid username or password');
  }

  return {
    id: admin.id,
    username: admin.username,
    created_at: admin.created_at,
  };
}
