'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { useAdminOrdersPaginated, useUpdateOrderStatus } from '@/lib/queries';
import { useTranslation } from '@/contexts/LanguageContext';

type SortField = 'id' | 'name' | 'phone' | 'total_price' | 'status' | 'created_at';
const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const { t } = useTranslation();

  // Pagination and filter state
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, sortBy, sortOrder]);

  // Use paginated query hook
  const { data, isLoading: loading, isFetching } = useAdminOrdersPaginated({
    page,
    limit: PAGE_SIZE,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: debouncedSearchTerm || undefined,
    sortBy,
    sortOrder,
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;
  const updateStatusMutation = useUpdateOrderStatus();

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: orderId, status: newStatus });
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(t('admin.orders.update-failed'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <span className="text-gray-400">
          {sortBy === field ? (
            sortOrder === 'asc' ? '↑' : '↓'
          ) : (
            <span className="opacity-0 group-hover:opacity-50">↕</span>
          )}
        </span>
      </div>
    </th>
  );

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.orders.page-title')}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">{t('admin.orders.page-subtitle')}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Filters row */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('admin.orders.search-placeholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="sm:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">{t('admin.orders.filter-all')}</option>
                    <option value="pending">{t('admin.orders.status.pending')}</option>
                    <option value="processing">{t('admin.orders.status.processing')}</option>
                    <option value="shipped">{t('admin.orders.status.shipped')}</option>
                    <option value="completed">{t('admin.orders.status.completed')}</option>
                    <option value="cancelled">{t('admin.orders.status.cancelled')}</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{t('admin.orders.loading')}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-600 text-lg">{t('admin.orders.no-orders')}</p>
              </div>
            ) : (
              <>
                <div className={`overflow-x-auto relative ${isFetching && !loading ? 'opacity-60' : ''}`}>
                  {isFetching && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <SortableHeader field="id">{t('admin.orders.order-id')}</SortableHeader>
                        <SortableHeader field="name">{t('admin.orders.customer')}</SortableHeader>
                        <SortableHeader field="phone">{t('order.phone')}</SortableHeader>
                        <SortableHeader field="total_price">{t('admin.orders.total')}</SortableHeader>
                        <SortableHeader field="status">{t('admin.orders.status')}</SortableHeader>
                        <SortableHeader field="created_at">{t('admin.orders.date')}</SortableHeader>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="text-blue-600 hover:text-blue-800"
                              prefetch={false}
                            >
                              #{order.id}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {order.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₮{order.total_price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                order.status
                              )} border-0 cursor-pointer`}
                            >
                              <option value="pending">{t('admin.orders.status.pending')}</option>
                              <option value="processing">{t('admin.orders.status.processing')}</option>
                              <option value="shipped">{t('admin.orders.status.shipped')}</option>
                              <option value="completed">{t('admin.orders.status.completed')}</option>
                              <option value="cancelled">{t('admin.orders.status.cancelled')}</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(order.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-600">
                      {pagination
                        ? t('admin.orders.showing-range')
                            .replace('{from}', (((pagination.page - 1) * pagination.limit) + 1).toString())
                            .replace('{to}', Math.min(pagination.page * pagination.limit, pagination.total).toString())
                            .replace('{total}', pagination.total.toString())
                        : t('admin.orders.showing-count').replace('{count}', orders.length.toString())}
                    </p>
                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage(1)}
                          disabled={!pagination.hasPrevPage || isFetching}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('admin.orders.pagination.first')}
                        </button>
                        <button
                          onClick={() => setPage(page - 1)}
                          disabled={!pagination.hasPrevPage || isFetching}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('admin.orders.pagination.prev')}
                        </button>
                        <span className="text-sm text-gray-600 px-2">
                          {t('admin.orders.pagination.page')
                            .replace('{page}', pagination.page.toString())
                            .replace('{total}', pagination.totalPages.toString())}
                        </span>
                        <button
                          onClick={() => setPage(page + 1)}
                          disabled={!pagination.hasNextPage || isFetching}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('admin.orders.pagination.next')}
                        </button>
                        <button
                          onClick={() => setPage(pagination.totalPages)}
                          disabled={!pagination.hasNextPage || isFetching}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {t('admin.orders.pagination.last')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
