'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { useSpecials, useUpdateSpecial } from '@/lib/queries';
import { useTranslation } from '@/contexts/LanguageContext';

type SortField = 'id' | 'name' | 'discounted_price' | 'status' | 'items_count';

export default function AdminSpecialsPage() {
  const { t } = useTranslation();

  // Use React Query hooks
  // Note: useSpecials() without status param fetches all statuses
  const { data: specialsData, isLoading: loading } = useSpecials();
  const updateSpecialMutation = useUpdateSpecial();

  const specials = specialsData || [];

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleStatusChange = async (specialId: number, newStatus: string) => {
    try {
      await updateSpecialMutation.mutateAsync({ id: specialId, status: newStatus });
    } catch (error) {
      console.error('Error updating special status:', error);
      alert(t('admin.specials.update-failed'));
    }
  };

  const filteredAndSortedSpecials = useMemo(() => {
    let result = [...specials];

    // Filter by search term
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'discounted_price':
          comparison = a.discounted_price - b.discounted_price;
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'items_count':
          comparison = (a.items?.length || 0) - (b.items?.length || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [specials, debouncedSearchTerm, statusFilter, sortBy, sortOrder]);

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
          ) : null}
        </span>
      </div>
    </th>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'hidden':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.specials.title')}</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">{t('admin.specials.manage')}</p>
            </div>
            <Link
              href="/admin/specials/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition whitespace-nowrap"
            >
              {t('admin.specials.add')}
            </Link>
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
                    placeholder="Search by name or description..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="sm:w-40">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="available">{t('admin.specials.status-available')}</option>
                    <option value="draft">{t('admin.specials.status-draft')}</option>
                    <option value="hidden">{t('admin.specials.status-hidden')}</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{t('admin.specials.loading')}</p>
              </div>
            ) : filteredAndSortedSpecials.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {t('admin.specials.no-specials')}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <SortableHeader field="id">{t('admin.specials.id')}</SortableHeader>
                        <SortableHeader field="name">{t('admin.specials.name')}</SortableHeader>
                        <SortableHeader field="discounted_price">{t('admin.specials.price')}</SortableHeader>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.specials.original-price')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.specials.savings')}
                        </th>
                        <SortableHeader field="status">{t('admin.specials.status')}</SortableHeader>
                        <SortableHeader field="items_count">{t('admin.specials.items')}</SortableHeader>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedSpecials.map((special) => {
                        const originalPrice = special.original_price || 0;
                        const savings = originalPrice - special.discounted_price;
                        const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

                        return (
                          <tr key={special.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                href={`/admin/specials/${special.id}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                #{special.id}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div>
                                <div className="font-medium">{special.name}</div>
                                {special.description && (
                                  <div className="text-gray-500 text-xs mt-1 truncate max-w-xs">{special.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="font-semibold text-green-600">₮{special.discounted_price.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ₮{originalPrice.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {savings > 0 ? (
                                <div>
                                  <div className="text-red-600 font-medium">-₮{savings.toLocaleString()}</div>
                                  <div className="text-xs text-red-500">({savingsPercent}%)</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <select
                                value={special.status || 'draft'}
                                onChange={(e) => handleStatusChange(special.id, e.target.value)}
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                  special.status || 'draft'
                                )} border-0 cursor-pointer`}
                              >
                                <option value="available">{t('admin.specials.status-available')}</option>
                                <option value="draft">{t('admin.specials.status-draft')}</option>
                                <option value="hidden">{t('admin.specials.status-hidden')}</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {special.items?.length || 0}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {filteredAndSortedSpecials.length} special{filteredAndSortedSpecials.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
