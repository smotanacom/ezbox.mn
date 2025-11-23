'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { clearAdminSession, getCurrentAdmin } from '@/lib/adminAuth';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUsername, setAdminUsername] = useState('');

  useEffect(() => {
    const admin = getCurrentAdmin();
    if (admin) {
      setAdminUsername(admin.username);
    }
  }, []);

  const handleLogout = () => {
    clearAdminSession();
    router.push('/admin');
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/admins', label: 'Admins' },
  ];

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/admin/dashboard" className="text-xl font-bold">
              EzBox Admin
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">
              Logged in as <span className="font-medium text-white">{adminUsername}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
