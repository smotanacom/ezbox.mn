'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import ImageUpload from '@/components/admin/ImageUpload';
import ModelUpload from '@/components/admin/ModelUpload';
import { productAPI, categoryAPI, parameterAPI } from '@/lib/api-client';
import type { ProductWithDetails, Category, ParameterGroup, Parameter } from '@/types/database';

export default function AdminProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params?.id as string);

  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allParameterGroups, setAllParameterGroups] = useState<ParameterGroup[]>([]);
  const [parametersByGroup, setParametersByGroup] = useState<Record<number, Parameter[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: 0,
    category_id: null as number | null,
    status: 'active',
  });

  // Inline parameter group creation
  const [showInlineGroupForm, setShowInlineGroupForm] = useState(false);
  const [inlineGroupData, setInlineGroupData] = useState({
    name: '',
    internal_name: '',
    parameters: [{ name: '', price_modifier: 0 }] as Array<{ name: string; price_modifier: number }>
  });

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      const [productResponse, categoriesResponse, paramGroupsResponse] = await Promise.all([
        productAPI.getById(productId),
        categoryAPI.getAll(),
        parameterAPI.getAllGroups(),
      ]);

      const productData = productResponse.product;

      if (!productData) {
        alert('Product not found');
        router.push('/admin/products');
        return;
      }

      setProduct(productData);
      setCategories(categoriesResponse.categories);
      setAllParameterGroups(paramGroupsResponse.parameterGroups);

      setFormData({
        name: productData.name,
        description: productData.description || '',
        base_price: productData.base_price,
        category_id: productData.category_id,
        status: productData.status,
      });

      // Build parameters map from the groups response (parameters are included)
      const paramsMap: Record<number, Parameter[]> = {};
      for (const group of paramGroupsResponse.parameterGroups) {
        paramsMap[group.id] = group.parameters || [];
      }
      setParametersByGroup(paramsMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await productAPI.update(productId, formData);
      alert('Product updated successfully');
      await fetchData();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${product?.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await productAPI.delete(productId);
      alert('Product deleted successfully');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleAddParameterGroup = async (groupId: number) => {
    try {
      // Get first parameter as default
      const params = parametersByGroup[groupId];
      const defaultParamId = params && params.length > 0 ? params[0].id : undefined;

      await productAPI.addParameterGroup(productId, groupId, defaultParamId);
      await fetchData();
    } catch (error) {
      console.error('Error adding parameter group:', error);
      alert('Failed to add parameter group');
    }
  };

  const handleRemoveParameterGroup = async (groupId: number) => {
    try {
      await productAPI.removeParameterGroup(productId, groupId);
      await fetchData();
    } catch (error) {
      console.error('Error removing parameter group:', error);
      alert('Failed to remove parameter group');
    }
  };

  // Inline parameter group creation handlers
  const handleInlineGroupCreate = async () => {
    if (!inlineGroupData.name.trim()) {
      alert('Please enter a group name');
      return;
    }

    const validParams = inlineGroupData.parameters.filter(p => p.name.trim());
    if (validParams.length === 0) {
      alert('Please add at least one parameter');
      return;
    }

    try {
      // Create the group with parameters
      const { parameterGroup: group, parameters } = await parameterAPI.createGroupWithParameters({
        name: inlineGroupData.name,
        internal_name: inlineGroupData.internal_name || inlineGroupData.name,
        parameters: validParams
      });

      // Add it to this product with first parameter as default
      const defaultParamId = parameters.length > 0 ? parameters[0].id : undefined;
      await productAPI.addParameterGroup(productId, group.id, defaultParamId);

      // Refresh data
      await fetchData();

      // Reset form
      setShowInlineGroupForm(false);
      setInlineGroupData({
        name: '',
        internal_name: '',
        parameters: [{ name: '', price_modifier: 0 }]
      });
    } catch (error) {
      console.error('Error creating parameter group:', error);
      alert('Failed to create parameter group');
    }
  };

  const addInlineParamRow = () => {
    setInlineGroupData({
      ...inlineGroupData,
      parameters: [...inlineGroupData.parameters, { name: '', price_modifier: 0 }]
    });
  };

  const updateInlineParamRow = (index: number, field: 'name' | 'price_modifier', value: string | number) => {
    const updated = [...inlineGroupData.parameters];
    updated[index] = { ...updated[index], [field]: value };
    setInlineGroupData({ ...inlineGroupData, parameters: updated });
  };

  const removeInlineParamRow = (index: number) => {
    if (inlineGroupData.parameters.length <= 1) return;
    const updated = inlineGroupData.parameters.filter((_, i) => i !== index);
    setInlineGroupData({ ...inlineGroupData, parameters: updated });
  };

  // Group parameter groups by display name for visual grouping
  const groupedParameterGroups = product?.parameter_groups?.reduce((acc, pg) => {
    const displayName = pg.parameter_group?.name || 'Unknown';
    if (!acc[displayName]) {
      acc[displayName] = [];
    }
    acc[displayName].push(pg);
    return acc;
  }, {} as Record<string, typeof product.parameter_groups>);

  if (loading) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading product...</p>
            </div>
          </div>
        </div>
      </AdminRouteGuard>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link
              href="/admin/products"
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            >
              ← Back to Products
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600 mt-2">Product ID: {productId}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category_id || ''}
                        onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">No category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Price (₮)
                    </label>
                    <input
                      type="number"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                  >
                    Delete Product
                  </button>
                </div>
              </div>

              {/* Product Images */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Product Images</h2>
                <ImageUpload
                  productId={productId}
                  existingImages={product?.images || []}
                  onImagesChange={fetchData}
                />
              </div>

              {/* 3D Model */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">3D Model</h2>
                <ModelUpload
                  productId={productId}
                  existingModel={product?.model || null}
                  productName={product?.name || 'Product'}
                  onModelChange={fetchData}
                />
              </div>

              {/* Parameter Groups */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Parameter Groups</h2>

                {groupedParameterGroups && Object.keys(groupedParameterGroups).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(groupedParameterGroups).map(([displayName, groups]) => (
                      <div key={displayName} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{displayName}</h3>
                          {groups.length > 1 && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              {groups.length} groups combined
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          {groups.map((pg) => (
                            <div key={pg.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/admin/parameter-groups#group-${pg.parameter_group_id}`}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    {pg.parameter_group?.internal_name || pg.parameter_group?.name}
                                  </Link>
                                  {pg.parameter_group?.internal_name && pg.parameter_group?.internal_name !== pg.parameter_group?.name && (
                                    <span className="text-xs text-gray-500">
                                      (internal: {pg.parameter_group.internal_name})
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Default: {pg.default_parameter?.name || 'None'}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveParameterGroup(pg.parameter_group_id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No parameter groups assigned yet.</p>
                )}

                {/* Add Parameter Group Section */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Add Parameter Group
                    </label>
                    {!showInlineGroupForm && (
                      <button
                        onClick={() => setShowInlineGroupForm(true)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Create new
                      </button>
                    )}
                  </div>

                  {/* Existing Groups Dropdown */}
                  {!showInlineGroupForm && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddParameterGroup(parseInt(e.target.value));
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select existing group...</option>
                      {allParameterGroups
                        .filter(
                          (pg) => !product.parameter_groups?.some((ppg) => ppg.parameter_group_id === pg.id)
                        )
                        .map((pg) => (
                          <option key={pg.id} value={pg.id}>
                            {pg.name} {pg.internal_name && pg.internal_name !== pg.name ? `(${pg.internal_name})` : ''}
                          </option>
                        ))}
                    </select>
                  )}

                  {/* Inline Group Creation Form */}
                  {showInlineGroupForm && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Group Name *</label>
                          <input
                            type="text"
                            value={inlineGroupData.name}
                            onChange={(e) => setInlineGroupData({ ...inlineGroupData, name: e.target.value })}
                            placeholder="e.g., Height, Color"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Internal Name</label>
                          <input
                            type="text"
                            value={inlineGroupData.internal_name}
                            onChange={(e) => setInlineGroupData({ ...inlineGroupData, internal_name: e.target.value })}
                            placeholder="Optional"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      </div>

                      {/* Parameters */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-medium text-gray-600">Parameters *</label>
                          <button
                            type="button"
                            onClick={addInlineParamRow}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            + Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {inlineGroupData.parameters.map((param, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={param.name}
                                onChange={(e) => updateInlineParamRow(index, 'name', e.target.value)}
                                placeholder={`Option ${index + 1}`}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && param.name.trim()) {
                                    e.preventDefault();
                                    addInlineParamRow();
                                  }
                                }}
                              />
                              <input
                                type="number"
                                value={param.price_modifier}
                                onChange={(e) => updateInlineParamRow(index, 'price_modifier', parseFloat(e.target.value) || 0)}
                                placeholder="₮0"
                                className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => removeInlineParamRow(index)}
                                className="p-1 text-gray-400 hover:text-red-600"
                                disabled={inlineGroupData.parameters.length <= 1}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleInlineGroupCreate}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                        >
                          Create & Add
                        </button>
                        <button
                          onClick={() => {
                            setShowInlineGroupForm(false);
                            setInlineGroupData({
                              name: '',
                              internal_name: '',
                              parameters: [{ name: '', price_modifier: 0 }]
                            });
                          }}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/admin/parameter-groups"
                    className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition text-center"
                  >
                    Manage Parameter Groups
                  </Link>
                  <Link
                    href="/admin/products"
                    className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition text-center"
                  >
                    View All Products
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Product Info</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-600">Created</dt>
                      <dd className="text-gray-900">{new Date(product.created_at).toLocaleDateString()}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">Last Updated</dt>
                      <dd className="text-gray-900">{new Date(product.updated_at).toLocaleDateString()}</dd>
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
