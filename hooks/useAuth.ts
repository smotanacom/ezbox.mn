/**
 * Client-side Authentication Hook
 *
 * Uses API client with httpOnly cookies instead of localStorage.
 * Replaces the old lib/auth.ts functions for client components.
 */

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/api-client';
import type { User } from '@/types/database';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    const { user } = await authAPI.login(phone, password);
    setUser(user);
    return user;
  }

  async function register(phone: string, password: string) {
    const { user } = await authAPI.register(phone, password);
    setUser(user);
    return user;
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

  return {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refresh: checkAuth,
  };
}

export function useAdminAuth() {
  const [admin, setAdmin] = useState<{ id: number; username: string; created_at: string } | null>(null);
  const [loading, setLoading] = useState(true);

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
    const { admin } = await authAPI.adminLogin(username, password);
    setAdmin(admin);
    return admin;
  }

  async function logout() {
    await authAPI.adminLogout();
    setAdmin(null);
  }

  return {
    admin,
    loading,
    login,
    logout,
    refresh: checkAuth,
  };
}
