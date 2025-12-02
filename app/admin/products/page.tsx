'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { useProducts, useCategories, useUpdateProduct } from '@/lib/queries';
import { useTranslation } from '@/contexts/LanguageContext';
import type { ProductWithDetails } from '@/types/database';

type SortField = 'id' | 'name' | 'category' | 'base_price' | 'status';

function AdminProductsContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterGroupId = searchParams?.get('group');

  // Use React Query hooks
  const { data: productsData, isLoading: productsLoading } = useProducts(true); // includeInactive = true for admin
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const updateProductMutation = useUpdateProduct();

  const products = productsData?.products || [];
  const categories = categoriesData || [];
  const loading = productsLoading || categoriesLoading;

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
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

  const handleStatusChange = async (productId: number, newStatus: string) => {
    try {
      // The API accepts status but the TypeScript type doesn't include it
      await updateProductMutation.mutateAsync({
        id: productId,
        status: newStatus
      } as any);
    } catch (error) {
      console.error('Error updating product status:', error);
      alert(t('admin.products.update-status-failed'));
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by parameter group if specified
    if (filterGroupId) {
      result = result.filter(p =>
        p.parameter_groups?.some(pg => pg.parameter_group_id === parseInt(filterGroupId))
      );
    }

    // Filter by search term
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.category?.name.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category_id === parseInt(categoryFilter));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
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
        case 'category':
          comparison = (a.category?.name || '').localeCompare(b.category?.name || '');
          break;
        case 'base_price':
          comparison = a.base_price - b.base_price;
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [products, filterGroupId, debouncedSearchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

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
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.products.title')}</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                {filterGroupId ? t('admin.products.filtered-by-group') : t('admin.products.page-subtitle')}
              </p>
            </div>
            <Link
              href="/admin/products/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition whitespace-nowrap"
            >
              {t('admin.products.add-new')}
            </Link>
          </div>

          {filterGroupId && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">
                {t('admin.products.filter-by-group').replace('{id}', filterGroupId)}
                <button
                  onClick={() => router.push('/admin/products')}
                  className="ml-4 text-blue-600 hover:text-blue-800 underline"
                >
                  {t('admin.products.clear-filter')}
                </button>
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Filters row */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('admin.products.search-placeholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="sm:w-40">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">{t('admin.products.all-categories')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:w-36">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">{t('admin.products.all-status')}</option>
                    <option value="active">{t('admin.products.status.active')}</option>
                    <option value="inactive">{t('admin.products.status.inactive')}</option>
                    <option value="draft">{t('admin.products.status.draft')}</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{t('admin.products.loading')}</p>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {filterGroupId ? t('admin.products.no-products-group') : t('admin.products.no-products')}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <SortableHeader field="id">{t('admin.products.table.id')}</SortableHeader>
                        <SortableHeader field="name">{t('admin.products.table.name')}</SortableHeader>
                        <SortableHeader field="category">{t('admin.products.table.category')}</SortableHeader>
                        <SortableHeader field="base_price">{t('admin.products.table.base-price')}</SortableHeader>
                        <SortableHeader field="status">{t('admin.products.table.status')}</SortableHeader>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.products.table.parameter-groups')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="text-blue-600 hover:text-blue-800"
                              prefetch={false}
                            >
                              #{product.id}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.description && (
                                <div className="text-gray-500 text-xs mt-1 truncate max-w-xs">{product.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.category?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₮{product.base_price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <select
                              value={product.status || 'active'}
                              onChange={(e) => handleStatusChange(product.id, e.target.value)}
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                product.status || 'active'
                              )} border-0 cursor-pointer`}
                            >
                              <option value="active">{t('admin.products.status.active')}</option>
                              <option value="inactive">{t('admin.products.status.inactive')}</option>
                              <option value="draft">{t('admin.products.status.draft')}</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex flex-wrap gap-1">
                              {product.parameter_groups?.map((pg) => (
                                <Link
                                  key={pg.id}
                                  href={`/admin/parameter-groups#group-${pg.parameter_group_id}`}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 transition"
                                  prefetch={false}
                                >
                                  {pg.parameter_group?.name}
                                </Link>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {filteredAndSortedProducts.length === 1
                      ? t('admin.products.showing-count').replace('{count}', filteredAndSortedProducts.length.toString())
                      : t('admin.products.showing-count-plural').replace('{count}', filteredAndSortedProducts.length.toString())}
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

export default function AdminProductsPage() {
  return (
    <Suspense fallback={
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          </div>
        </div>
      </AdminRouteGuard>
    }>
      <AdminProductsContent />
    </Suspense>
  );
}
