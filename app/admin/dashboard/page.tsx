'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('status, total_price');

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter((o: any) => o.status === 'pending').length || 0;
      const completedOrders = orders?.filter((o: any) => o.status === 'completed').length || 0;

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
      });
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome to the EzBox admin portal</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading statistics...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm font-medium text-gray-600 mb-2">Total Orders</div>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm font-medium text-gray-600 mb-2">Pending Orders</div>
                  <div className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-sm font-medium text-gray-600 mb-2">Completed Orders</div>
                  <div className="text-3xl font-bold text-green-600">{stats.completedOrders}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                  href="/admin/orders"
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Orders</h2>
                    <svg
                      className="w-8 h-8 text-blue-600 group-hover:text-blue-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">
                    View and manage all orders. Search, filter, and update order status.
                  </p>
                </Link>

                <Link
                  href="/admin/products"
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Products</h2>
                    <svg
                      className="w-8 h-8 text-blue-600 group-hover:text-blue-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">Manage products, categories, and parameter groups.</p>
                </Link>

                <Link
                  href="/admin/parameter-groups"
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Parameter Groups</h2>
                    <svg
                      className="w-8 h-8 text-blue-600 group-hover:text-blue-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">Manage parameter groups and their parameters.</p>
                </Link>

                <Link
                  href="/admin/admins"
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Admins</h2>
                    <svg
                      className="w-8 h-8 text-blue-600 group-hover:text-blue-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">Manage admin users. Add new admins and view all admin accounts.</p>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminRouteGuard>
  );
}
