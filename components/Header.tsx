'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCurrentUser, clearSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, User, LogOut, Package, Settings } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import type { User as UserType } from '@/types/database';

export default function Header() {
  const router = useRouter();
  const { items } = useCart();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    // Check for user on mount
    setUser(getCurrentUser());

    // Listen for storage changes (login/logout in other tabs)
    const handleStorageChange = () => {
      setUser(getCurrentUser());
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for login/logout in same tab
    const handleAuthChange = () => {
      setUser(getCurrentUser());
    };

    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  return (
    <header className="bg-background border-b sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold hover:opacity-80 transition-opacity">
            <Package className="h-8 w-8 text-primary" />
            <span>EzBox<span className="text-primary">.mn</span></span>
          </Link>

          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/products">
                Products
              </Link>
            </Button>

            {user && (
              <Button variant="ghost" asChild>
                <Link href="/orders">
                  <Package className="mr-2 h-4 w-4" />
                  Orders
                </Link>
              </Button>
            )}

            <Button variant="ghost" asChild className="relative">
              <Link href="/cart">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Cart
                {items.length > 0 && (
                  <Badge className="ml-2 rounded-full px-2 py-0.5 text-xs" variant="secondary">
                    {items.length}
                  </Badge>
                )}
              </Link>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-medium text-xs">
                        {user.phone.substring(0, 2)}
                      </span>
                    </div>
                    <span className="hidden sm:inline">{user.phone}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="text-sm font-normal text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{user.phone}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">
                    <User className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
