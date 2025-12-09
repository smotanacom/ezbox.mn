import { supabase } from './supabase';
import type { Admin } from '@/types/database';
import bcrypt from 'bcryptjs';

const ADMIN_SESSION_KEY = 'ezbox_admin_session';

export interface AdminAuthSession {
  admin: Admin;
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

// Create new admin (used by admin portal)
export async function createAdmin(
  username: string,
  password: string,
  email?: string
): Promise<Admin> {
  const response = await fetch('/api/admins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ username, password, email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create admin');
  }

  const { admin } = await response.json();
  return admin;
}

// Admin login
export async function adminLogin(username: string, password: string): Promise<Admin> {
  // Get admin
  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  if (!admin) {
    throw new Error('Invalid username or password');
  }

  // Verify password
  const isValid = await verifyPassword(password, (admin as any).password_hash);
  if (!isValid) {
    throw new Error('Invalid username or password');
  }

  return admin as Admin;
}

// Session management (client-side)
export function saveAdminSession(admin: Admin): void {
  const sessionId = Math.random().toString(36).substring(2);
  const session: AdminAuthSession = { admin, sessionId };
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    // Dispatch event to notify of auth change
    window.dispatchEvent(new Event('admin-auth-change'));
  }
}

export function getAdminSession(): AdminAuthSession | null {
  if (typeof window === 'undefined') return null;

  const sessionStr = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!sessionStr) return null;

  try {
    return JSON.parse(sessionStr);
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    // Dispatch event to notify of auth change
    window.dispatchEvent(new Event('admin-auth-change'));
  }
}

export function getCurrentAdmin(): Admin | null {
  const session = getAdminSession();
  return session?.admin || null;
}

// Change admin password
export async function changeAdminPassword(
  adminId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Get admin to verify current password
  const { data: admin, error: fetchError } = await supabase
    .from('admins')
    .select('password_hash')
    .eq('id', adminId)
    .single();

  if (fetchError) throw fetchError;

  // Verify current password
  const isValid = await verifyPassword(currentPassword, (admin as any).password_hash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  const { error: updateError } = await (supabase as any)
    .from('admins')
    .update({
      password_hash: newPasswordHash,
      updated_at: new Date().toISOString(),
    })
    .eq('id', adminId);

  if (updateError) throw updateError;
}

// Set admin password (admin management - no current password required)
export async function setAdminPassword(
  adminId: number,
  newPassword: string
): Promise<void> {
  const response = await fetch(`/api/admins/${adminId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ password: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to set password');
  }
}

// List all admins (admin management)
export async function listAdmins(): Promise<Admin[]> {
  const response = await fetch('/api/admins', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch admins');
  }

  const { admins } = await response.json();
  return admins;
}

// Delete admin (admin management)
export async function deleteAdmin(adminId: number): Promise<void> {
  const response = await fetch(`/api/admins/${adminId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete admin');
  }
}
