'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { useTranslation } from '@/contexts/LanguageContext';
import { useCategories, useProducts } from '@/lib/queries';

type SortField = 'id' | 'name' | 'products_count';

export default function AdminCategoriesPage() {
  const { t } = useTranslation();

  // Use React Query hooks
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: productsData, isLoading: productsLoading } = useProducts();

  const categories = categoriesData || [];
  const products = productsData?.products || [];
  const loading = categoriesLoading || productsLoading;

  // Calculate product counts
  const productCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    products.forEach((product) => {
      if (product.category_id) {
        counts[product.category_id] = (counts[product.category_id] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
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

  const filteredAndSortedCategories = useMemo(() => {
    let result = [...categories];

    // Filter by search term
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
      );
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
        case 'products_count':
          comparison = (productCounts[a.id] || 0) - (productCounts[b.id] || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [categories, debouncedSearchTerm, sortBy, sortOrder, productCounts]);

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

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.categories.title')}</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">{t('admin.categories.manage')}</p>
            </div>
            <Link
              href="/admin/categories/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition whitespace-nowrap"
            >
              {t('admin.categories.add-new')}
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
                    placeholder={t('admin.categories.search-placeholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{t('admin.categories.loading')}</p>
              </div>
            ) : filteredAndSortedCategories.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {t('admin.categories.no-categories')}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <SortableHeader field="id">{t('admin.categories.id')}</SortableHeader>
                        <SortableHeader field="name">{t('admin.categories.name')}</SortableHeader>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.categories.description')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.categories.picture-url')}
                        </th>
                        <SortableHeader field="products_count">{t('admin.categories.products-count')}</SortableHeader>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedCategories.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/admin/categories/${category.id}`}
                              className="text-blue-600 hover:text-blue-800"
                              prefetch={false}
                            >
                              #{category.id}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="font-medium">{category.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {category.description || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <span className="truncate max-w-xs block text-xs">
                              {category.picture_url || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {productCounts[category.id] || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {filteredAndSortedCategories.length === 1
                      ? t('admin.categories.showing-count').replace('{count}', filteredAndSortedCategories.length.toString())
                      : t('admin.categories.showing-count-plural').replace('{count}', filteredAndSortedCategories.length.toString())}
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
