'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import SpecialImageUpload from '@/components/admin/SpecialImageUpload';
import { specialAPI, productAPI } from '@/lib/api-client';
import type { ProductWithDetails } from '@/types/database';
import { useTranslation } from '@/contexts/LanguageContext';

interface SelectedItem {
  product_id: number;
  quantity: number;
}

export default function AdminNewSpecialPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { products: productsData } = await productAPI.getAll(true);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.product_id) {
      alert('Please select a product');
      return;
    }

    // Check if product already exists in selectedItems
    const existingIndex = selectedItems.findIndex(item => item.product_id === newItem.product_id);
    if (existingIndex !== -1) {
      // Update quantity if it already exists
      const updated = [...selectedItems];
      updated[existingIndex].quantity += newItem.quantity;
      setSelectedItems(updated);
    } else {
      // Add new item
      setSelectedItems([...selectedItems, { ...newItem }]);
    }

    setNewItem({ product_id: 0, quantity: 1 });
  };

  const handleRemoveItem = (productId: number) => {
    setSelectedItems(selectedItems.filter(item => item.product_id !== productId));
  };

  const handleUpdateItemQuantity = (productId: number, quantity: number) => {
    setSelectedItems(selectedItems.map(item =>
      item.product_id === productId ? { ...item, quantity } : item
    ));
  };

  const calculateTotalPrice = () => {
    return selectedItems.reduce((total, item) => {
      const product = products.find(p => p.id === item.product_id);
      return total + (product?.base_price || 0) * item.quantity;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.discounted_price <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // 1. Create the special first
      const { special: newSpecial } = await specialAPI.create(formData);

      // 2. Add all selected items to the special
      for (const item of selectedItems) {
        await specialAPI.addItem(newSpecial.id, {
          productId: item.product_id,
          quantity: item.quantity
        });
      }

      alert(t('admin.specials.create-success'));
      router.push('/admin/specials');
    } catch (error) {
      console.error('Error creating special:', error);
      alert(t('admin.specials.create-failed'));
      setSaving(false);
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
              <p className="mt-4 text-gray-600">{t('admin.specials.loading')}</p>
            </div>
          </div>
        </div>
      </AdminRouteGuard>
    );
  }

  const originalPrice = calculateTotalPrice();
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
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.specials.new')}</h1>
            <p className="text-gray-600 mt-2">Create a new special offer bundle</p>
          </div>

          <form onSubmit={handleSubmit}>
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
                </div>

                {/* Bundle Items */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{t('admin.specials.bundle-items')}</h2>
                  <p className="text-sm text-gray-600 mb-4">{t('admin.specials.bundle-items-description')}</p>

                  {selectedItems.length > 0 ? (
                    <div className="space-y-3 mb-6">
                      {selectedItems.map((item) => {
                        const product = products.find(p => p.id === item.product_id);
                        return (
                          <div key={item.product_id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {product?.name || `Product #${item.product_id}`}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {t('admin.specials.item-quantity')}:
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItemQuantity(item.product_id, parseInt(e.target.value))}
                                  className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  min="1"
                                />
                              </div>
                              {product?.base_price && (
                                <div className="text-sm text-gray-500 mt-1">
                                  ₮{(product.base_price * item.quantity).toLocaleString()}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.product_id)}
                              className="ml-4 text-red-600 hover:text-red-800 text-sm"
                            >
                              {t('admin.specials.remove-item')}
                            </button>
                          </div>
                        );
                      })}
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
                        type="button"
                        onClick={handleAddItem}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                      >
                        {t('common.add')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
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
                        <dd className="text-gray-900">{selectedItems.length}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">Total Products</dt>
                        <dd className="text-gray-900">
                          {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
