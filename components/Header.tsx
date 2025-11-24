'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCurrentUser, clearSession } from '@/lib/auth';
import { getUserOrders } from '@/lib/api';
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
import { useTranslation } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type { User as UserType } from '@/types/database';

export default function Header() {
  const router = useRouter();
  const { items } = useCart();
  const { t } = useTranslation();
  const [user, setUser] = useState<UserType | null>(null);
  const [hasOrders, setHasOrders] = useState(false);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    // Check for user on mount
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Check if user has orders
    if (currentUser) {
      getUserOrders(currentUser.id).then(orders => {
        setHasOrders(orders.length > 0);
        setOrderCount(orders.length);
      });
    } else {
      setHasOrders(false);
      setOrderCount(0);
    }

    // Listen for storage changes (login/logout in other tabs)
    const handleStorageChange = () => {
      const updatedUser = getCurrentUser();
      setUser(updatedUser);
      if (updatedUser) {
        getUserOrders(updatedUser.id).then(orders => {
          setHasOrders(orders.length > 0);
          setOrderCount(orders.length);
        });
      } else {
        setHasOrders(false);
        setOrderCount(0);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event for login/logout in same tab
    const handleAuthChange = () => {
      const updatedUser = getCurrentUser();
      setUser(updatedUser);
      if (updatedUser) {
        getUserOrders(updatedUser.id).then(orders => {
          setHasOrders(orders.length > 0);
          setOrderCount(orders.length);
        });
      } else {
        setHasOrders(false);
        setOrderCount(0);
      }
    };

    window.addEventListener('auth-change', handleAuthChange);

    // Listen for order creation events
    const handleOrderCreated = () => {
      const updatedUser = getCurrentUser();
      if (updatedUser) {
        getUserOrders(updatedUser.id).then(orders => {
          setHasOrders(orders.length > 0);
          setOrderCount(orders.length);
        });
      }
    };

    window.addEventListener('order-created', handleOrderCreated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('order-created', handleOrderCreated);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setHasOrders(false);
    setOrderCount(0);
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  return (
    <header className="bg-background border-b sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold hover:opacity-80 transition-opacity">
              <Package className="h-8 w-8 text-primary" />
              <span>EzBox<span className="text-primary">.mn</span></span>
            </Link>

            <Button variant="ghost" asChild>
              <Link href="/products">
                {t('nav.products')}
              </Link>
            </Button>
          </div>

          <nav className="flex items-center gap-4">
            {user && hasOrders && (
              <Button variant="ghost" asChild className="relative">
                <Link href="/orders">
                  <Package className="mr-2 h-4 w-4" />
                  {t('admin.orders')}
                  <Badge className="ml-2 rounded-full px-2 py-0.5 text-xs" variant="secondary">
                    {orderCount}
                  </Badge>
                </Link>
              </Button>
            )}

            {items.length > 0 && (
              <Button variant="ghost" asChild className="relative">
                <Link href="/cart">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {t('nav.cart')}
                  <Badge className="ml-2 rounded-full px-2 py-0.5 text-xs" variant="secondary">
                    {items.length}
                  </Badge>
                </Link>
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.name || user.phone}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="text-sm font-medium">{user.name || t('nav.login')}</p>
                      <p className="text-sm font-normal text-muted-foreground">{user.phone}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      {t('admin.dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">
                    <User className="mr-2 h-4 w-4" />
                    {t('nav.login')}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">
                    {t('nav.register')}
                  </Link>
                </Button>
              </div>
            )}

            <LanguageSwitcher />
          </nav>
        </div>
      </div>
    </header>
  );
}
