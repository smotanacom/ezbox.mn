import { supabase } from './supabase';
import type { User } from '@/types/database';
import bcrypt from 'bcryptjs';

const SESSION_KEY = 'ezbox_session';
const GUEST_SESSION_KEY = 'ezbox_guest_session';

export interface AuthSession {
  user: User;
  sessionId: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Register new user
export async function register(
  phone: string,
  password: string,
  name?: string,
  address?: string,
  secondaryPhone?: string
): Promise<User> {
  // Validate phone number (8 digits)
  if (!/^\d{8}$/.test(phone)) {
    throw new Error('Phone number must be exactly 8 digits');
  }

  // Validate secondary phone if provided
  if (secondaryPhone && !/^\d{8}$/.test(secondaryPhone)) {
    throw new Error('Secondary phone number must be exactly 8 digits');
  }

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (existingUser) {
    throw new Error('User with this phone number already exists');
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Create user
  const { data, error } = await supabase
    .from('users')
    .insert({
      phone,
      password_hash,
      name: name || null,
      address: address || null,
      secondary_phone: secondaryPhone || null,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

// Login
export async function login(phone: string, password: string): Promise<User> {
  // Validate phone number
  if (!/^\d{8}$/.test(phone)) {
    throw new Error('Phone number must be exactly 8 digits');
  }

  // Get user
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) throw error;
  if (!user) {
    throw new Error('Invalid phone number or password');
  }

  // Verify password
  const isValid = await verifyPassword(password, (user as any).password_hash);
  if (!isValid) {
    throw new Error('Invalid phone number or password');
  }

  return user as User;
}

// Session management (client-side)
export function saveSession(user: User): void {
  const sessionId = Math.random().toString(36).substring(2);
  const session: AuthSession = { user, sessionId };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    // Remove guest session if exists
    localStorage.removeItem(GUEST_SESSION_KEY);
    // Dispatch event to notify header of auth change
    window.dispatchEvent(new Event('auth-change'));
  }
}

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;

  try {
    return JSON.parse(sessionStr);
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
    // Dispatch event to notify header of auth change
    window.dispatchEvent(new Event('auth-change'));
  }
}

export function getCurrentUser(): User | null {
  const session = getSession();
  return session?.user || null;
}

// Guest session management
export function getOrCreateGuestSession(): string {
  if (typeof window === 'undefined') {
    return Math.random().toString(36).substring(2);
  }

  let sessionId = localStorage.getItem(GUEST_SESSION_KEY);
  if (!sessionId) {
    sessionId = `guest_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    localStorage.setItem(GUEST_SESSION_KEY, sessionId);
  }
  return sessionId;
}

// Update user profile
export async function updateUserProfile(
  userId: number,
  updates: {
    name?: string;
    address?: string;
    secondary_phone?: string;
  }
): Promise<User> {
  // Validate secondary phone if provided
  if (updates.secondary_phone && !/^\d{8}$/.test(updates.secondary_phone)) {
    throw new Error('Secondary phone number must be exactly 8 digits');
  }

  const { data, error } = await (supabase as any)
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  // Update session
  const session = getSession();
  if (session && session.user.id === userId) {
    saveSession(data);
  }

  return data as User;
}
