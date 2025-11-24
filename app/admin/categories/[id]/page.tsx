'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { useTranslation } from '@/contexts/LanguageContext';
import { getCategories, updateCategory, deleteCategory } from '@/lib/api';
import type { Category } from '@/types/database';

export default function AdminCategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const categoryId = parseInt(params?.id as string);

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    picture_url: '',
  });

  useEffect(() => {
    fetchData();
  }, [categoryId]);

  const fetchData = async () => {
    try {
      const categories = await getCategories();
      const categoryData = categories.find(c => c.id === categoryId);

      if (!categoryData) {
        alert(t('admin.category.error.load'));
        router.push('/admin/categories');
        return;
      }

      setCategory(categoryData);
      setFormData({
        name: categoryData.name,
        description: categoryData.description || '',
        picture_url: categoryData.picture_url || '',
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      alert(t('admin.category.error.load'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert(t('admin.category.form.name-required'));
      return;
    }

    setSaving(true);
    try {
      await updateCategory(categoryId, formData);
      alert(t('admin.category.success.updated'));
      await fetchData();
    } catch (error) {
      console.error('Error updating category:', error);
      alert(t('admin.category.error.update'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('admin.categories.delete-confirm'))) {
      return;
    }

    try {
      await deleteCategory(categoryId);
      alert(t('admin.category.success.updated'));
      router.push('/admin/categories');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(t('admin.categories.delete-failed'));
    }
  };

  if (loading) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">{t('admin.categories.loading')}</p>
            </div>
          </div>
        </div>
      </AdminRouteGuard>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link
              href="/admin/categories"
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            >
              ← {t('common.back')}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.category.edit.title')}</h1>
            <p className="text-gray-600 mt-2">{t('admin.category.edit.subtitle')}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.category.form.name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('admin.category.form.name-placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.category.form.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder={t('admin.category.form.description-placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.category.form.picture-url')}
                </label>
                <input
                  type="text"
                  value={formData.picture_url}
                  onChange={(e) => setFormData({ ...formData, picture_url: e.target.value })}
                  placeholder={t('admin.category.form.picture-url-placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {saving ? t('admin.category.form.submitting') : t('admin.category.form.submit')}
                  </button>
                  <Link
                    href="/admin/categories"
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition font-medium inline-block"
                  >
                    {t('admin.category.form.cancel')}
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium ml-auto"
                  >
                    {t('admin.categories.delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
