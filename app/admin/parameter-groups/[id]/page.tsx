'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  getParameterGroup,
  getParameters,
  getProductsUsingParameterGroup,
  updateParameterGroup,
  deleteParameterGroup,
  cloneParameterGroup,
  createParameter,
  updateParameter,
  deleteParameter,
} from '@/lib/api';
import type { ParameterGroup, Parameter, Product } from '@/types/database';

interface ParameterFormState {
  name: string;
  price_modifier: number;
  description: string;
}

export default function ParameterGroupDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const groupId = parseInt(params.id as string);

  const [group, setGroup] = useState<ParameterGroup | null>(null);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Group form (always editable)
  const [groupForm, setGroupForm] = useState({ name: '', internal_name: '', description: '' });

  // Parameters form state (keyed by param id)
  const [paramForms, setParamForms] = useState<Record<number, ParameterFormState>>({});

  // New parameter
  const [showNewParam, setShowNewParam] = useState(false);
  const [newParamForm, setNewParamForm] = useState({ name: '', price_modifier: 0, description: '' });

  useEffect(() => {
    if (groupId) {
      fetchData();
    }
  }, [groupId]);

  const fetchData = async () => {
    try {
      const [groupData, paramsData, productsData] = await Promise.all([
        getParameterGroup(groupId),
        getParameters(groupId),
        getProductsUsingParameterGroup(groupId),
      ]);

      setGroup(groupData);
      setParameters(paramsData);
      setProducts(productsData);

      if (groupData) {
        setGroupForm({
          name: groupData.name,
          internal_name: groupData.internal_name || '',
          description: groupData.description || '',
        });
      }

      // Initialize parameter forms
      const forms: Record<number, ParameterFormState> = {};
      for (const param of paramsData) {
        forms[param.id] = {
          name: param.name,
          price_modifier: param.price_modifier,
          description: param.description || '',
        };
      }
      setParamForms(forms);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) {
      alert('Group name is required');
      return;
    }

    setSaving(true);
    try {
      await updateParameterGroup(groupId, {
        name: groupForm.name,
        internal_name: groupForm.internal_name || groupForm.name,
        description: groupForm.description,
      });
      await fetchData();
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (products.length > 0) {
      alert(`Cannot delete this parameter group. It is used by ${products.length} product(s). Remove it from all products first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${group?.name}"? This will also delete all ${parameters.length} parameter(s) in this group.`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteParameterGroup(groupId);
      router.push('/admin/parameter-groups');
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete parameter group');
      setDeleting(false);
    }
  };

  const handleCloneGroup = async () => {
    try {
      const cloned = await cloneParameterGroup(groupId);
      alert('Parameter group cloned successfully');
      router.push(`/admin/parameter-groups/${cloned.id}`);
    } catch (error) {
      console.error('Error cloning group:', error);
      alert('Failed to clone group');
    }
  };

  const updateParamForm = (paramId: number, field: keyof ParameterFormState, value: string | number) => {
    setParamForms((prev) => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        [field]: value,
      },
    }));
  };

  const handleSaveParam = async (paramId: number) => {
    const form = paramForms[paramId];
    if (!form?.name.trim()) {
      alert('Parameter name is required');
      return;
    }

    setSaving(true);
    try {
      await updateParameter(paramId, {
        name: form.name,
        price_modifier: form.price_modifier,
        description: form.description,
      });
      await fetchData();
    } catch (error) {
      console.error('Error updating parameter:', error);
      alert('Failed to update parameter');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParam = async (paramId: number, paramName: string) => {
    if (!confirm(`Are you sure you want to delete "${paramName}"?`)) {
      return;
    }

    try {
      await deleteParameter(paramId);
      await fetchData();
    } catch (error) {
      console.error('Error deleting parameter:', error);
      alert('Failed to delete parameter');
    }
  };

  const handleAddParam = async () => {
    if (!newParamForm.name.trim()) {
      alert('Parameter name is required');
      return;
    }

    setSaving(true);
    try {
      await createParameter({
        parameter_group_id: groupId,
        name: newParamForm.name,
        price_modifier: newParamForm.price_modifier,
        description: newParamForm.description,
      });
      await fetchData();
      setShowNewParam(false);
      setNewParamForm({ name: '', price_modifier: 0, description: '' });
    } catch (error) {
      console.error('Error creating parameter:', error);
      alert('Failed to create parameter');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </AdminRouteGuard>
    );
  }

  if (!group) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <p className="text-gray-600">Parameter group not found</p>
              <Link href="/admin/parameter-groups" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
                Back to Parameter Groups
              </Link>
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
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/admin/parameter-groups" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Parameter Groups
            </Link>
          </div>

          {/* Group Details Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Parameter Group #{group.id}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={handleCloneGroup}
                  className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition"
                >
                  Clone
                </button>
                <button
                  onClick={handleDeleteGroup}
                  disabled={deleting}
                  className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Color, Height"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Name
                </label>
                <input
                  type="text"
                  value={groupForm.internal_name}
                  onChange={(e) => setGroupForm({ ...groupForm, internal_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="For internal reference"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <button
                  onClick={handleSaveGroup}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {saving ? 'Saving...' : 'Save Group'}
                </button>
              </div>
            </div>
          </div>

          {/* Products Using This Group */}
          {products.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Products Using This Group ({products.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200 transition"
                  >
                    {product.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Parameters Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Parameters ({parameters.length})
              </h2>
              <button
                onClick={() => setShowNewParam(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                + Add Parameter
              </button>
            </div>

            {/* Add New Parameter Form */}
            {showNewParam && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-medium text-gray-900 mb-3">New Parameter</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newParamForm.name}
                      onChange={(e) => setNewParamForm({ ...newParamForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="e.g., Red, 50cm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Price Modifier (₮)</label>
                    <input
                      type="number"
                      value={newParamForm.price_modifier}
                      onChange={(e) => setNewParamForm({ ...newParamForm, price_modifier: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                    <input
                      type="text"
                      value={newParamForm.description}
                      onChange={(e) => setNewParamForm({ ...newParamForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleAddParam}
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-gray-400"
                  >
                    {saving ? 'Adding...' : 'Add Parameter'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewParam(false);
                      setNewParamForm({ name: '', price_modifier: 0, description: '' });
                    }}
                    className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Parameters List */}
            {parameters.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No parameters yet. Add one above.</p>
            ) : (
              <div className="space-y-3">
                {parameters.map((param) => {
                  const form = paramForms[param.id];
                  if (!form) return null;

                  return (
                    <div
                      key={param.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => updateParamForm(param.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Price Modifier (₮)</label>
                          <input
                            type="number"
                            value={form.price_modifier}
                            onChange={(e) => updateParamForm(param.id, 'price_modifier', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                          <input
                            type="text"
                            value={form.description}
                            onChange={(e) => updateParamForm(param.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Optional"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveParam(param.id)}
                            disabled={saving}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => handleDeleteParam(param.id, param.name)}
                            className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
