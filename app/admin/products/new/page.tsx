'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { productAPI, categoryAPI, parameterAPI } from '@/lib/api-client';
import { parameterAPI, productAPI } from "@/lib/api-client";
import type { Category, ParameterGroup, Parameter } from '@/types/database';

interface InlineParameterGroup {
  name: string;
  internal_name: string;
  parameters: Array<{ name: string; price_modifier: number }>;
}

export default function NewProductPage() {
  const router = useRouter();
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
    status: 'draft' as string,
  });

  // Parameter groups to add to the product
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [inlineGroups, setInlineGroups] = useState<InlineParameterGroup[]>([]);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [currentInlineGroup, setCurrentInlineGroup] = useState<InlineParameterGroup>({
    name: '',
    internal_name: '',
    parameters: [{ name: '', price_modifier: 0 }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesResponse, paramGroupsResponse] = await Promise.all([
        categoryAPI.getAll(),
        parameterAPI.getAllGroups()
      ]);
      setCategories(categoriesResponse.categories);
      setAllParameterGroups(paramGroupsResponse.parameterGroups);

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

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a product name');
      return;
    }

    if (formData.base_price < 0) {
      alert('Base price cannot be negative');
      return;
    }

    setSaving(true);
    try {
      // 1. Create the product
      const { product: newProduct } = await productAPI.create({
        name: formData.name,
        description: formData.description,
        base_price: formData.base_price,
        category_id: formData.category_id || undefined,
      });

      // 2. Add selected existing parameter groups
      for (const groupId of selectedGroupIds) {
        const params = parametersByGroup[groupId];
        const defaultParamId = params && params.length > 0 ? params[0].id : undefined;
        await productAPI.addParameterGroup(newProduct.id, groupId, defaultParamId);
      }

      // 3. Create and add inline parameter groups
      for (const inlineGroup of inlineGroups) {
        const { parameterGroup: group, parameters } = await parameterAPI.createGroupWithParameters({
          name: inlineGroup.name,
          internal_name: inlineGroup.internal_name || inlineGroup.name,
          parameters: inlineGroup.parameters.filter(p => p.name.trim())
        });
        const defaultParamId = parameters.length > 0 ? parameters[0].id : undefined;
        await productAPI.addParameterGroup(newProduct.id, group.id, defaultParamId);
      }

      alert('Product created successfully!');
      router.push(`/admin/products/${newProduct.id}`);
    } catch (error) {
      console.error('Error creating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
      alert(`Failed to create product: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Inline group handlers
  const addSelectedGroup = (groupId: number) => {
    if (!selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  const removeSelectedGroup = (groupId: number) => {
    setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId));
  };

  const addInlineGroup = () => {
    if (!currentInlineGroup.name.trim()) {
      alert('Please enter a group name');
      return;
    }
    const validParams = currentInlineGroup.parameters.filter(p => p.name.trim());
    if (validParams.length === 0) {
      alert('Please add at least one parameter');
      return;
    }
    setInlineGroups([...inlineGroups, { ...currentInlineGroup, parameters: validParams }]);
    setCurrentInlineGroup({
      name: '',
      internal_name: '',
      parameters: [{ name: '', price_modifier: 0 }]
    });
    setShowInlineForm(false);
  };

  const removeInlineGroup = (index: number) => {
    setInlineGroups(inlineGroups.filter((_, i) => i !== index));
  };

  const addParamRow = () => {
    setCurrentInlineGroup({
      ...currentInlineGroup,
      parameters: [...currentInlineGroup.parameters, { name: '', price_modifier: 0 }]
    });
  };

  const updateParamRow = (index: number, field: 'name' | 'price_modifier', value: string | number) => {
    const updated = [...currentInlineGroup.parameters];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentInlineGroup({ ...currentInlineGroup, parameters: updated });
  };

  const removeParamRow = (index: number) => {
    if (currentInlineGroup.parameters.length <= 1) return;
    const updated = currentInlineGroup.parameters.filter((_, i) => i !== index);
    setCurrentInlineGroup({ ...currentInlineGroup, parameters: updated });
  };

  if (loading) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </AdminRouteGuard>
    );
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link
              href="/admin/products"
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            >
              ← Back to Products
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
            <p className="text-gray-600 mt-2">Add a new product to your catalog</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Kitchen Cabinet"
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
                  placeholder="Describe the product..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Create as draft to add parameter groups before publishing
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (₮) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="1000"
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Base price before parameter modifiers
                </p>
              </div>

              {/* Parameter Groups Section */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Parameter Groups</h3>
                    <p className="text-sm text-gray-500">Add configuration options for this product</p>
                  </div>
                  {!showInlineForm && (
                    <button
                      type="button"
                      onClick={() => setShowInlineForm(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Create new group
                    </button>
                  )}
                </div>

                {/* Selected/Added Groups List */}
                {(selectedGroupIds.length > 0 || inlineGroups.length > 0) && (
                  <div className="mb-4 space-y-2">
                    {/* Selected existing groups */}
                    {selectedGroupIds.map(groupId => {
                      const group = allParameterGroups.find(g => g.id === groupId);
                      const params = parametersByGroup[groupId] || [];
                      return (
                        <div key={`selected-${groupId}`} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div>
                            <span className="font-medium text-gray-900">{group?.name}</span>
                            {group?.internal_name && group.internal_name !== group.name && (
                              <span className="text-xs text-gray-500 ml-2">({group.internal_name})</span>
                            )}
                            <div className="text-sm text-gray-600">
                              {params.map(p => p.name).join(', ')}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelectedGroup(groupId)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}

                    {/* Inline groups (to be created) */}
                    {inlineGroups.map((group, index) => (
                      <div key={`inline-${index}`} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                        <div>
                          <span className="font-medium text-gray-900">{group.name}</span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded ml-2">New</span>
                          {group.internal_name && group.internal_name !== group.name && (
                            <span className="text-xs text-gray-500 ml-2">({group.internal_name})</span>
                          )}
                          <div className="text-sm text-gray-600">
                            {group.parameters.map(p => p.name).join(', ')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeInlineGroup(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add existing group dropdown */}
                {!showInlineForm && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addSelectedGroup(parseInt(e.target.value));
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select existing group...</option>
                    {allParameterGroups
                      .filter(pg => !selectedGroupIds.includes(pg.id))
                      .map(pg => (
                        <option key={pg.id} value={pg.id}>
                          {pg.name} {pg.internal_name && pg.internal_name !== pg.name ? `(${pg.internal_name})` : ''}
                        </option>
                      ))}
                  </select>
                )}

                {/* Inline Group Creation Form */}
                {showInlineForm && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Create New Parameter Group</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Group Name *</label>
                        <input
                          type="text"
                          value={currentInlineGroup.name}
                          onChange={(e) => setCurrentInlineGroup({ ...currentInlineGroup, name: e.target.value })}
                          placeholder="e.g., Height, Color"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Internal Name</label>
                        <input
                          type="text"
                          value={currentInlineGroup.internal_name}
                          onChange={(e) => setCurrentInlineGroup({ ...currentInlineGroup, internal_name: e.target.value })}
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
                          onClick={addParamRow}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {currentInlineGroup.parameters.map((param, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={param.name}
                              onChange={(e) => updateParamRow(index, 'name', e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && param.name.trim()) {
                                  e.preventDefault();
                                  addParamRow();
                                }
                              }}
                            />
                            <input
                              type="number"
                              value={param.price_modifier}
                              onChange={(e) => updateParamRow(index, 'price_modifier', parseFloat(e.target.value) || 0)}
                              placeholder="₮0"
                              className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeParamRow(index)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              disabled={currentInlineGroup.parameters.length <= 1}
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
                        type="button"
                        onClick={addInlineGroup}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                      >
                        Add Group
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowInlineForm(false);
                          setCurrentInlineGroup({
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

              <div className="pt-6 border-t border-gray-200">
                <div className="flex gap-4">
                  <button
                    onClick={handleCreate}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    {saving ? 'Creating...' : 'Create Product'}
                  </button>
                  <Link
                    href="/admin/products"
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition font-medium inline-block"
                  >
                    Cancel
                  </Link>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  After creating the product, you can upload images and 3D models on the product detail page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
