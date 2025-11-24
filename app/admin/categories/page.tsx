'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { useTranslation } from '@/contexts/LanguageContext';
import { getCategories, getProducts, updateCategory, deleteCategory } from '@/lib/api';
import type { Category } from '@/types/database';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Category>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesData, productsData] = await Promise.all([
        getCategories(),
        getProducts(),
      ]);
      setCategories(categoriesData);

      // Count products per category
      const counts: Record<number, number> = {};
      productsData.forEach((product) => {
        if (product.category_id) {
          counts[product.category_id] = (counts[product.category_id] || 0) + 1;
        }
      });
      setProductCounts(counts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditValues({
      name: category.name,
      description: category.description || '',
      picture_url: category.picture_url || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (categoryId: number) => {
    try {
      await updateCategory(categoryId, editValues);
      await fetchData();
      setEditingId(null);
      setEditValues({});
    } catch (error) {
      console.error('Error updating category:', error);
      alert(t('admin.categories.update-failed'));
    }
  };

  const handleDelete = async (categoryId: number, categoryName: string) => {
    if (!confirm(t('admin.categories.delete-confirm'))) {
      return;
    }

    try {
      await deleteCategory(categoryId);
      await fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(t('admin.categories.delete-failed'));
    }
  };

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('admin.categories.title')}</h1>
              <p className="text-gray-600 mt-2">{t('admin.categories.manage')}</p>
            </div>
            <Link
              href="/admin/categories/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              {t('admin.categories.add-new')}
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">{t('admin.categories.loading')}</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.categories.id')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.categories.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.categories.description')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.categories.picture-url')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.categories.products-count')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.categories.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => {
                      const isEditing = editingId === category.id;
                      return (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {category.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editValues.name || ''}
                                onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <div className="font-medium">{category.name}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {isEditing ? (
                              <textarea
                                value={editValues.description || ''}
                                onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                rows={2}
                              />
                            ) : (
                              <span className="text-gray-500">{category.description || '-'}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editValues.picture_url || ''}
                                onChange={(e) => setEditValues({ ...editValues, picture_url: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <span className="text-gray-500 text-xs truncate max-w-xs block">
                                {category.picture_url || '-'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {productCounts[category.id] || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => saveEdit(category.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  {t('admin.categories.save')}
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  {t('admin.categories.cancel')}
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => startEditing(category)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  {t('admin.categories.edit')}
                                </button>
                                <Link
                                  href={`/admin/categories/${category.id}`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  {t('common.edit')}
                                </Link>
                                <button
                                  onClick={() => handleDelete(category.id, category.name)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  {t('admin.categories.delete')}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {categories.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  {t('admin.categories.no-categories')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminRouteGuard>
  );
}
