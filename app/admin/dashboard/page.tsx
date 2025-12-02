'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav, { adminNavItems } from '@/components/AdminNav';
import { useTranslation } from '@/contexts/LanguageContext';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">{t('admin.dashboard.subtitle')}</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">{t('admin.dashboard.loading')}</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t('admin.dashboard.order-stats')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-xs font-medium text-green-600 mb-1">{t('admin.dashboard.stats.revenue')}</div>
                    <div className="text-2xl font-bold text-green-700">₮{stats.totalRevenue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">{t('admin.dashboard.stats.total')}</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">{t('admin.dashboard.stats.pending')}</div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">{t('admin.dashboard.stats.processing')}</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.processingOrders}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">{t('admin.dashboard.stats.shipped')}</div>
                    <div className="text-2xl font-bold text-purple-600">{stats.shippedOrders}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">{t('admin.dashboard.stats.completed')}</div>
                    <div className="text-2xl font-bold text-green-600">{stats.completedOrders}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">{t('admin.dashboard.stats.cancelled')}</div>
                    <div className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">{t(item.labelKey)}</h2>
                      <svg
                        className="w-8 h-8 text-blue-600 group-hover:text-blue-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {item.icon}
                      </svg>
                    </div>
                    <p className="text-gray-600">{t(item.descriptionKey)}</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminRouteGuard>
  );
}
