'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { useTranslation } from '@/contexts/LanguageContext';
import { createParameterGroupWithParameters } from '@/lib/api';

export default function NewParameterGroupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    internal_name: '',
    description: '',
    parameters: [{ name: '', price_modifier: 0 }] as Array<{ name: string; price_modifier: number }>,
  });

  const addParameterRow = () => {
    setFormData({
      ...formData,
      parameters: [...formData.parameters, { name: '', price_modifier: 0 }],
    });
  };

  const updateParameterRow = (index: number, field: 'name' | 'price_modifier', value: string | number) => {
    const updated = [...formData.parameters];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, parameters: updated });
  };

  const removeParameterRow = (index: number) => {
    if (formData.parameters.length <= 1) return;
    const updated = formData.parameters.filter((_, i) => i !== index);
    setFormData({ ...formData, parameters: updated });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Group name is required');
      return;
    }

    // Filter out empty parameters
    const validParams = formData.parameters.filter((p) => p.name.trim());
    if (validParams.length === 0) {
      alert('Please add at least one parameter');
      return;
    }

    setSaving(true);
    try {
      const newGroup = await createParameterGroupWithParameters(
        {
          name: formData.name,
          internal_name: formData.internal_name || formData.name,
          description: formData.description,
        },
        validParams
      );
      router.push(`/admin/parameter-groups/${newGroup.id}`);
    } catch (error) {
      console.error('Error creating parameter group:', error);
      alert('Failed to create parameter group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/admin/parameter-groups" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Parameter Groups
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.parameters.create-group-title')}</h1>

            {/* Group Details */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.parameters.group-name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder={t('admin.parameters.group-name-placeholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.parameters.internal-name')}
                  <span className="text-gray-400 text-xs ml-1">({t('admin.parameters.internal-name-hint')})</span>
                </label>
                <input
                  type="text"
                  value={formData.internal_name}
                  onChange={(e) => setFormData({ ...formData, internal_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder={t('admin.parameters.internal-name-placeholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.parameters.description')}
                  <span className="text-gray-400 text-xs ml-1">({t('admin.optional')})</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder={t('admin.parameters.description-placeholder')}
                />
              </div>
            </div>

            {/* Parameters Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  {t('admin.parameters.parameters')} <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addParameterRow}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {t('admin.parameters.add-option')}
                </button>
              </div>

              <div className="space-y-2">
                {formData.parameters.map((param, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => updateParameterRow(index, 'name', e.target.value)}
                      placeholder={t('admin.parameters.option-placeholder').replace('{index}', String(index + 1))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && param.name.trim()) {
                          e.preventDefault();
                          addParameterRow();
                        }
                      }}
                    />
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₮</span>
                      <input
                        type="number"
                        value={param.price_modifier}
                        onChange={(e) => updateParameterRow(index, 'price_modifier', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeParameterRow(index)}
                      className="p-2 text-gray-400 hover:text-red-600 transition"
                      disabled={formData.parameters.length <= 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Press Enter to add another option. Price modifier is added to the base price.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-2 border-t border-gray-200 pt-6">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {saving ? 'Creating...' : t('admin.parameters.create-group')}
              </button>
              <Link
                href="/admin/parameter-groups"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                {t('admin.parameters.cancel')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
