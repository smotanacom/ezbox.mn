'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { getSpecials, updateSpecial, deleteSpecial, calculateSpecialOriginalPrice } from '@/lib/api';
import type { SpecialWithItems } from '@/types/database';
import { useTranslation } from '@/contexts/LanguageContext';

export default function AdminSpecialsPage() {
  const { t } = useTranslation();
  const [specials, setSpecials] = useState<SpecialWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<SpecialWithItems>>({});
  const [originalPrices, setOriginalPrices] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const specialsData = await getSpecials();
      setSpecials(specialsData);

      // Calculate original prices for all specials
      const prices: Record<number, number> = {};
      for (const special of specialsData) {
        try {
          prices[special.id] = await calculateSpecialOriginalPrice(special.id);
        } catch (error) {
          console.error(`Error calculating price for special ${special.id}:`, error);
          prices[special.id] = 0;
        }
      }
      setOriginalPrices(prices);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (special: SpecialWithItems) => {
    setEditingId(special.id);
    setEditValues({
      name: special.name,
      description: special.description || '',
      discounted_price: special.discounted_price,
      status: special.status,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (specialId: number) => {
    try {
      await updateSpecial(specialId, editValues);
      await fetchData();
      setEditingId(null);
      setEditValues({});
    } catch (error) {
      console.error('Error updating special:', error);
      alert(t('admin.specials.update-failed'));
    }
  };

  const handleDelete = async (specialId: number, specialName: string) => {
    if (!confirm(t('admin.specials.delete-confirm').replace('{name}', specialName))) {
      return;
    }

    try {
      await deleteSpecial(specialId);
      await fetchData();
    } catch (error) {
      console.error('Error deleting special:', error);
      alert(t('admin.specials.delete-failed'));
    }
  };

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('admin.specials.title')}</h1>
              <p className="text-gray-600 mt-2">{t('admin.specials.manage')}</p>
            </div>
            <Link
              href="/admin/specials/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              {t('admin.specials.add')}
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">{t('admin.specials.loading')}</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.specials.id')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.specials.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.specials.price')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.specials.original-price')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.specials.savings')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.specials.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.specials.items')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.specials.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {specials.map((special) => {
                      const isEditing = editingId === special.id;
                      const originalPrice = originalPrices[special.id] || 0;
                      const savings = originalPrice - special.discounted_price;
                      const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

                      return (
                        <tr key={special.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {special.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {isEditing ? (
                              <div>
                                <input
                                  type="text"
                                  value={editValues.name || ''}
                                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <textarea
                                  value={editValues.description || ''}
                                  onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                                  rows={2}
                                  className="w-full mt-2 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  placeholder={t('admin.specials.description')}
                                />
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium">{special.name}</div>
                                {special.description && (
                                  <div className="text-gray-500 text-xs mt-1">{special.description}</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editValues.discounted_price || 0}
                                onChange={(e) => setEditValues({ ...editValues, discounted_price: parseFloat(e.target.value) })}
                                className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <span className="font-semibold text-green-600">₮{special.discounted_price.toLocaleString()}</span>
                            )}
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
                            {isEditing ? (
                              <select
                                value={editValues.status || 'draft'}
                                onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="available">{t('admin.specials.status-available')}</option>
                                <option value="draft">{t('admin.specials.status-draft')}</option>
                                <option value="hidden">{t('admin.specials.status-hidden')}</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                special.status === 'available'
                                  ? 'bg-green-100 text-green-800'
                                  : special.status === 'hidden'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {special.status === 'available' ? t('admin.specials.status-available') :
                                 special.status === 'hidden' ? t('admin.specials.status-hidden') :
                                 t('admin.specials.status-draft')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {special.items?.length || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => saveEdit(special.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  {t('common.save')}
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  {t('common.cancel')}
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => startEditing(special)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  {t('common.edit')}
                                </button>
                                <Link
                                  href={`/admin/specials/${special.id}`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Details
                                </Link>
                                <button
                                  onClick={() => handleDelete(special.id, special.name)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  {t('common.delete')}
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

              {specials.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  {t('admin.specials.no-specials')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminRouteGuard>
  );
}
