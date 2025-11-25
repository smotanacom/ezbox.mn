/**
 * Authentication Context
 *
 * Provides shared authentication state across the entire app.
 * Replaces the useAuth hook with a context provider pattern
 * to ensure Header and other components see real-time auth updates.
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api-client';
import type { User } from '@/types/database';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticating: boolean;
  login: (phone: string, password: string) => Promise<User>;
  register: (phone: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (updates: { address?: string; phone?: string }) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { user } = await authAPI.getUser();
      setUser(user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(phone: string, password: string) {
    setIsAuthenticating(true);
    try {
      const { user } = await authAPI.login(phone, password);
      setUser(user);
      return user;
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function register(phone: string, password: string) {
    setIsAuthenticating(true);
    try {
      const { user } = await authAPI.register(phone, password);
      setUser(user);
      return user;
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function logout() {
    await authAPI.logout();
    setUser(null);
  }

  async function updateProfile(updates: { address?: string; phone?: string }) {
    const { user: updatedUser } = await authAPI.updateProfile(updates);
    setUser(updatedUser);
    return updatedUser;
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    await authAPI.changePassword(currentPassword, newPassword);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticating,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refresh: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Admin auth context
interface AdminAuthContextType {
  admin: { id: number; username: string; created_at: string } | null;
  loading: boolean;
  isAuthenticating: boolean;
  login: (username: string, password: string) => Promise<{ id: number; username: string; created_at: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<{ id: number; username: string; created_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { admin } = await authAPI.getAdmin();
      setAdmin(admin);
    } catch (error) {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string) {
    setIsAuthenticating(true);
    try {
      const { admin } = await authAPI.adminLogin(username, password);
      setAdmin(admin);
      return admin;
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function logout() {
    await authAPI.adminLogout();
    setAdmin(null);
  }

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        isAuthenticating,
        login,
        logout,
        refresh: checkAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
