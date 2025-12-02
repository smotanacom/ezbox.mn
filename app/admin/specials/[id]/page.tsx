'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import SpecialImageUpload from '@/components/admin/SpecialImageUpload';
import { specialAPI, productAPI } from '@/lib/api-client';
import type { ProductWithDetails, SpecialWithItems } from '@/types/database';
import { useTranslation } from '@/contexts/LanguageContext';

export default function AdminSpecialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const specialId = parseInt(params?.id as string);

  const [special, setSpecial] = useState<SpecialWithItems | null>(null);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discounted_price: 0,
    status: 'draft' as 'draft' | 'available' | 'hidden',
  });

  const [newItem, setNewItem] = useState({
    product_id: 0,
    quantity: 1,
  });

  useEffect(() => {
    fetchData();
  }, [specialId]);

  const fetchData = async () => {
    try {
      const [specialResponse, productsResponse] = await Promise.all([
        specialAPI.getById(specialId),
        productAPI.getAll(true),
      ]);

      if (!specialResponse.special) {
        alert(t('admin.specials.delete-failed'));
        router.push('/admin/specials');
        return;
      }

      setSpecial(specialResponse.special as any);
      setProducts(productsResponse.products);

      setFormData({
        name: specialResponse.special.name,
        description: specialResponse.special.description || '',
        discounted_price: specialResponse.special.discounted_price,
        status: specialResponse.special.status as 'draft' | 'available' | 'hidden',
      });
    } catch (error) {
      console.error('Error fetching special:', error);
      alert(t('admin.specials.delete-failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || formData.discounted_price <= 0) {
      alert(t('admin.specials.fill-required'));
      return;
    }

    setSaving(true);
    try {
      await specialAPI.update(specialId, formData);
      alert(t('admin.specials.update-success'));
      await fetchData();
    } catch (error) {
      console.error('Error updating special:', error);
      alert(t('admin.specials.update-failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('admin.specials.delete-confirm').replace('{name}', special?.name || ''))) {
      return;
    }

    try {
      await specialAPI.delete(specialId);
      alert(t('admin.specials.delete-success'));
      router.push('/admin/specials');
    } catch (error) {
      console.error('Error deleting special:', error);
      alert(t('admin.specials.delete-failed'));
    }
  };

  const handleAddItem = async () => {
    if (!newItem.product_id) {
      alert('Please select a product');
      return;
    }

    try {
      await specialAPI.addItem(specialId, {
        productId: newItem.product_id,
        quantity: newItem.quantity
      });
      setNewItem({ product_id: 0, quantity: 1 });
      await fetchData();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  const handleUpdateItemQuantity = async (itemId: number, quantity: number) => {
    try {
      await specialAPI.updateItem(specialId, itemId, { quantity });
      await fetchData();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await specialAPI.removeItem(specialId, itemId);
      await fetchData();
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item');
    }
  };

  const calculateOriginalPrice = () => {
    if (!special?.items) return 0;
    return special.items.reduce((total, item) => {
      return total + (item.product?.base_price || 0) * item.quantity;
    }, 0);
  };

  if (loading) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">{t('admin.specials.loading')}</p>
            </div>
          </div>
        </div>
      </AdminRouteGuard>
    );
  };

  if (!special) {
    return null;
  }

  const originalPrice = calculateOriginalPrice();
  const savings = originalPrice - formData.discounted_price;
  const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link
              href="/admin/specials"
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            >
              ← {t('admin.specials.back')}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.specials.edit')}</h1>
            <p className="text-gray-600 mt-2">Special Offer ID: {specialId}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
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
                      />
                    </div>
                  </div>

                  {originalPrice > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">{t('admin.specials.original-price')}</div>
                          <div className="text-lg font-semibold text-gray-900">₮{originalPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">{t('admin.specials.discount')}</div>
                          <div className="text-lg font-semibold text-green-600">₮{formData.discounted_price.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">{t('admin.specials.savings')}</div>
                          <div className="text-lg font-semibold text-red-600">
                            -₮{savings.toLocaleString()} ({savingsPercent}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    {saving ? t('admin.specials.saving') : t('admin.specials.save')}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                  >
                    {t('admin.specials.delete')}
                  </button>
                </div>
              </div>

              {/* Special Image */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('admin.specials.image')}</h2>
                <SpecialImageUpload
                  specialId={specialId}
                  existingImagePath={special?.picture_url || null}
                  onImageChange={fetchData}
                />
              </div>

              {/* Bundle Items */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{t('admin.specials.bundle-items')}</h2>
                <p className="text-sm text-gray-600 mb-4">{t('admin.specials.bundle-items-description')}</p>

                {special.items && special.items.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {special.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {item.product?.name || `Product #${item.product_id}`}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {t('admin.specials.item-quantity')}:
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value))}
                              className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              min="1"
                            />
                          </div>
                          {item.product?.base_price && (
                            <div className="text-sm text-gray-500 mt-1">
                              ₮{(item.product.base_price * item.quantity).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="ml-4 text-red-600 hover:text-red-800 text-sm"
                        >
                          {t('admin.specials.remove-item')}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mb-6">{t('admin.specials.no-items')}</p>
                )}

                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.specials.add-item')}
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={newItem.product_id}
                      onChange={(e) => setNewItem({ ...newItem, product_id: parseInt(e.target.value) })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>{t('admin.specials.select-product')}</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ₮{product.base_price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                      className="w-24 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      placeholder="Qty"
                    />
                    <button
                      onClick={handleAddItem}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                    >
                      {t('common.add')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h3 className="font-bold text-gray-900 mb-4">{t('admin.specials.quick-actions')}</h3>
                <div className="space-y-2">
                  <Link
                    href="/admin/specials"
                    className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition text-center"
                  >
                    {t('admin.specials.view-all')}
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Bundle Info</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-600">{t('admin.specials.items')}</dt>
                      <dd className="text-gray-900">{special.items?.length || 0}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Total Products</dt>
                      <dd className="text-gray-900">
                        {special.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">{t('admin.specials.created')}</dt>
                      <dd className="text-gray-900">{new Date(special.created_at).toLocaleDateString()}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">{t('admin.specials.updated')}</dt>
                      <dd className="text-gray-900">{new Date(special.updated_at).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
