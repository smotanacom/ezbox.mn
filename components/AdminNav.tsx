'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, ReactNode } from 'react';
import { clearAdminSession, getCurrentAdmin } from '@/lib/adminAuth';
import { useTranslation } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/types/translations';

export interface AdminNavItem {
  href: string;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: ReactNode;
}

export const adminNavItems: AdminNavItem[] = [
  {
    href: '/admin/products',
    labelKey: 'admin.nav.products',
    descriptionKey: 'admin.dashboard.products-description',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    ),
  },
  {
    href: '/admin/categories',
    labelKey: 'admin.categories.title',
    descriptionKey: 'admin.dashboard.categories-description',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    ),
  },
  {
    href: '/admin/orders',
    labelKey: 'admin.nav.orders',
    descriptionKey: 'admin.dashboard.orders-description',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    ),
  },
  {
    href: '/admin/specials',
    labelKey: 'admin.nav.specials',
    descriptionKey: 'admin.dashboard.specials-description',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    ),
  },
  {
    href: '/admin/parameter-groups',
    labelKey: 'admin.nav.parameters',
    descriptionKey: 'admin.dashboard.parameters-description',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 10h16M4 14h16M4 18h16"
      />
    ),
  },
  {
    href: '/admin/admins',
    labelKey: 'admin.nav.admins',
    descriptionKey: 'admin.dashboard.admins-description',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    ),
  },
  {
    href: '/admin/export',
    labelKey: 'admin.nav.export',
    descriptionKey: 'admin.dashboard.export-description',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    ),
  },
  {
    href: '/admin/custom-design',
    labelKey: 'admin.custom-design',
    descriptionKey: 'admin.custom-design.description',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
  },
  {
    href: '/admin/chat',
    labelKey: 'admin.nav.chat',
    descriptionKey: 'admin.dashboard.chat-description',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    ),
  },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [adminUsername, setAdminUsername] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const admin = getCurrentAdmin();
    if (admin) {
      setAdminUsername(admin.username);
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout API to clear httpOnly cookie
      await fetch('/api/auth/admin/logout', {
        method: 'POST',
      });
      // Also clear localStorage
      clearAdminSession();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      router.push('/admin');
    }
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/admin/dashboard" className="text-xl font-bold">
            {t('admin.nav.title')}
          </Link>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-label={t('admin.nav.toggle-menu')}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Menu */}
        {mobileMenuOpen && (
          <div className="pb-4">
            <div className="flex flex-col space-y-2">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    prefetch={false}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-3 ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {item.icon}
                    </svg>
                    {t(item.labelKey)}
                  </Link>
                );
              })}

              {/* Mobile User Info & Logout */}
              <div className="border-t border-gray-700 pt-4 mt-2">
                <div className="px-3 py-2 text-sm text-gray-300">
                  {t('admin.nav.logged-in-as')} <span className="font-medium text-white">{adminUsername}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full mt-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition flex items-center gap-3"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  {t('admin.logout')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
