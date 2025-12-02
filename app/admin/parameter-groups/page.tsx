'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { useTranslation } from '@/contexts/LanguageContext';
import { useParameterGroups, useProducts } from '@/lib/queries';

type SortField = 'id' | 'name' | 'internal_name' | 'parameters_count' | 'products_count';

export default function AdminParameterGroupsPage() {
  const { t } = useTranslation();

  // Use React Query hooks
  const { data: groupsData, isLoading: groupsLoading } = useParameterGroups();
  const { data: productsData, isLoading: productsLoading } = useProducts();

  const groups = groupsData || [];
  const products = productsData?.products || [];
  const loading = groupsLoading || productsLoading;

  // Enrich groups with product count
  const groupsWithProductCounts = useMemo(() => {
    return groups.map(group => {
      const productsUsingGroup = products.filter(p =>
        p.parameter_groups?.some(pg => pg.parameter_group_id === group.id)
      );
      return {
        ...group,
        products: productsUsingGroup,
      };
    });
  }, [groups, products]);

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

  const filteredAndSortedGroups = useMemo(() => {
    let result = [...groupsWithProductCounts];

    // Filter by search term
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(term) ||
        g.internal_name?.toLowerCase().includes(term) ||
        g.description?.toLowerCase().includes(term) ||
        g.parameters.some(p => p.name.toLowerCase().includes(term))
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
        case 'internal_name':
          comparison = (a.internal_name || '').localeCompare(b.internal_name || '');
          break;
        case 'parameters_count':
          comparison = a.parameters.length - b.parameters.length;
          break;
        case 'products_count':
          comparison = a.products.length - b.products.length;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [groupsWithProductCounts, debouncedSearchTerm, sortBy, sortOrder]);

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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.parameters.title')}</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">{t('admin.parameters.subtitle')}</p>
            </div>
            <Link
              href="/admin/parameter-groups/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition whitespace-nowrap"
            >
              {t('admin.parameters.create-group')}
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Search row */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('admin.parameters.search-placeholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{t('admin.parameters.loading')}</p>
              </div>
            ) : filteredAndSortedGroups.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {t('admin.parameters.no-groups')}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <SortableHeader field="id">ID</SortableHeader>
                        <SortableHeader field="name">{t('admin.parameters.group-name')}</SortableHeader>
                        <SortableHeader field="internal_name">{t('admin.parameters.internal-name')}</SortableHeader>
                        <SortableHeader field="parameters_count">{t('admin.parameters.parameters')}</SortableHeader>
                        <SortableHeader field="products_count">{t('admin.parameters.products-column')}</SortableHeader>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedGroups.map((group) => (
                        <tr key={group.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/admin/parameter-groups/${group.id}`}
                              className="text-blue-600 hover:text-blue-800"
                              prefetch={false}
                            >
                              #{group.id}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{group.name}</div>
                              {group.description && <div className="text-gray-500 text-xs mt-1">{group.description}</div>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {group.internal_name || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex flex-wrap gap-1">
                              {group.parameters.length > 0 ? (
                                group.parameters.map((param) => (
                                  <span
                                    key={param.id}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                  >
                                    {param.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 text-xs">{t('admin.parameters.no-parameters')}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link href={`/admin/products?group=${group.id}`} className="text-blue-600 hover:text-blue-800" prefetch={false}>
                              {group.products.length}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {filteredAndSortedGroups.length === 1
                      ? t('admin.parameters.showing-count').replace('{count}', filteredAndSortedGroups.length.toString())
                      : t('admin.parameters.showing-count-plural').replace('{count}', filteredAndSortedGroups.length.toString())}
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
