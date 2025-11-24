'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { createSpecial } from '@/lib/api';
import { useTranslation } from '@/contexts/LanguageContext';

export default function AdminNewSpecialPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discounted_price: 0,
    status: 'draft' as 'draft' | 'available' | 'hidden',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.discounted_price <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const newSpecial = await createSpecial(formData);
      alert(t('admin.specials.create-success'));
      router.push(`/admin/specials/${newSpecial.id}`);
    } catch (error) {
      console.error('Error creating special:', error);
      alert(t('admin.specials.create-failed'));
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
              href="/admin/specials"
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            >
              ← {t('admin.specials.back')}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.specials.new')}</h1>
            <p className="text-gray-600 mt-2">Create a new special offer bundle</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('admin.specials.basic-info')}</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.specials.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('admin.specials.name-placeholder')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.specials.description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('admin.specials.description-placeholder')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.specials.status')}
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">{t('admin.specials.status-draft')}</option>
                      <option value="available">{t('admin.specials.status-available')}</option>
                      <option value="hidden">{t('admin.specials.status-hidden')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.specials.price-tugrik')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.discounted_price}
                      onChange={(e) => setFormData({ ...formData, discounted_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('admin.specials.price-placeholder')}
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> After creating the special offer, you'll be able to add products to the bundle on the edit page.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {saving ? 'Creating...' : 'Create Special Offer'}
                </button>
                <Link
                  href="/admin/specials"
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                  {t('common.cancel')}
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
