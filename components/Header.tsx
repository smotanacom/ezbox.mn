'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { ShoppingCart, User, LogOut, Package, Settings, Menu, X, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth, useAdminAuth } from '@/hooks/useAuth';
import { orderAPI } from '@/lib/api-client';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header() {
  const router = useRouter();
  const { items } = useCart();
  const { t } = useTranslation();
  const { user, logout, isAuthenticating } = useAuth();
  const { admin } = useAdminAuth();
  const [hasOrders, setHasOrders] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user has orders
    if (user) {
      orderAPI.getAll().then(({ orders }) => {
        setHasOrders(orders.length > 0);
        setOrderCount(orders.length);
      }).catch(() => {
        setHasOrders(false);
        setOrderCount(0);
      });
    } else {
      setHasOrders(false);
      setOrderCount(0);
    }
  }, [user]);

  // Listen for order creation events
  useEffect(() => {
    const handleOrderCreated = () => {
      if (user) {
        orderAPI.getAll().then(({ orders }) => {
          setHasOrders(orders.length > 0);
          setOrderCount(orders.length);
        });
      }
    };

    window.addEventListener('order-created', handleOrderCreated);
    return () => {
      window.removeEventListener('order-created', handleOrderCreated);
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setHasOrders(false);
    setOrderCount(0);
    setMobileMenuOpen(false);
    router.push('/');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-background border-b sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo + Desktop Navigation */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold hover:opacity-80 transition-opacity">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span>EzBox<span className="text-primary">.mn</span></span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2 ml-8">
              <Button variant="ghost" asChild>
                <Link href="/products">
                  {t('nav.products')}
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/specials">
                  {t('nav.specials')}
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/custom">
                  {t('nav.custom-design')}
                </Link>
              </Button>
            </div>
          </div>

          {/* Desktop Right Nav */}
          <nav className="hidden lg:flex items-center gap-4">
            {admin && (
              <Button variant="ghost" asChild>
                <Link href="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('nav.admin')}
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

            {isAuthenticating ? (
              <Button variant="outline" disabled className="gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">{t('auth.authenticating')}</span>
              </Button>
            ) : user ? (
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
                    <Link href="/orders" className="cursor-pointer flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      {t('admin.orders')}
                      {orderCount > 0 && (
                        <Badge className="ml-auto rounded-full px-2 py-0.5 text-xs" variant="secondary">
                          {orderCount}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      {t('account.title')}
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

          {/* Mobile Right Nav */}
          <div className="flex lg:hidden items-center gap-2">
            <LanguageSwitcher />

            {items.length > 0 && (
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link href="/cart">
                  <ShoppingCart className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 rounded-full px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5 flex items-center justify-center" variant="secondary">
                    {items.length}
                  </Badge>
                </Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4 space-y-2">
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link href="/products" onClick={closeMobileMenu}>
                {t('nav.products')}
              </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link href="/specials" onClick={closeMobileMenu}>
                {t('nav.specials')}
              </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link href="/custom" onClick={closeMobileMenu}>
                {t('nav.custom-design')}
              </Link>
            </Button>

            {items.length > 0 && (
              <>
                <div className="border-t my-2" />
                <Button variant="ghost" asChild className="w-full justify-start">
                  <Link href="/cart" onClick={closeMobileMenu}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {t('nav.cart')}
                    <Badge className="ml-auto rounded-full px-2 py-0.5 text-xs" variant="secondary">
                      {items.length}
                    </Badge>
                  </Link>
                </Button>
              </>
            )}

            {admin && (
              <>
                <div className="border-t my-2" />
                <Button variant="ghost" asChild className="w-full justify-start">
                  <Link href="/admin" onClick={closeMobileMenu}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('nav.admin')}
                  </Link>
                </Button>
              </>
            )}

            <div className="border-t my-2" />

            {isAuthenticating ? (
              <div className="px-3 py-4 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('auth.authenticating')}</span>
              </div>
            ) : user ? (
              <>
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user.name || t('nav.login')}</p>
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                </div>
                <Button variant="ghost" asChild className="w-full justify-start">
                  <Link href="/orders" onClick={closeMobileMenu}>
                    <Package className="mr-2 h-4 w-4" />
                    {t('admin.orders')}
                    {orderCount > 0 && (
                      <Badge className="ml-auto rounded-full px-2 py-0.5 text-xs" variant="secondary">
                        {orderCount}
                      </Badge>
                    )}
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="w-full justify-start">
                  <Link href="/account" onClick={closeMobileMenu}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t('account.title')}
                  </Link>
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-destructive hover:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="w-full justify-start">
                  <Link href="/login" onClick={closeMobileMenu}>
                    <User className="mr-2 h-4 w-4" />
                    {t('nav.login')}
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/signup" onClick={closeMobileMenu}>
                    {t('nav.register')}
                  </Link>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
