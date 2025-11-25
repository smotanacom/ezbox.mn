'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { useTranslation } from '@/contexts/LanguageContext';
import { categoryAPI } from '@/lib/api-client';

export default function NewCategoryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert(t('admin.category.form.name-required'));
      return;
    }

    setSaving(true);
    try {
      const { category: newCategory } = await categoryAPI.create({
        name: formData.name,
        description: formData.description,
      });

      alert(t('admin.category.success.created'));
      // Redirect to edit page to allow image upload
      router.push(`/admin/categories/${newCategory.id}`);
    } catch (error) {
      console.error('Error creating category:', error);
      alert(t('admin.category.error.create'));
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.category.new.title')}</h1>
            <p className="text-gray-600 mt-2">{t('admin.category.new.subtitle')}</p>
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

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-700">
                  {t('admin.category.image-after-create')}
                </p>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex gap-4">
                  <button
                    onClick={handleCreate}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
