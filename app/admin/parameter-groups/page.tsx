'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import {
  getParameterGroups,
  getParameters,
  getProductsUsingParameterGroup,
  createParameterGroup,
  updateParameterGroup,
  deleteParameterGroup,
  cloneParameterGroup,
  createParameter,
  updateParameter,
  deleteParameter,
} from '@/lib/api';
import type { ParameterGroup, Parameter, Product } from '@/types/database';

interface ParameterGroupWithDetails extends ParameterGroup {
  parameters: Parameter[];
  products: Product[];
  isExpanded: boolean;
}

export default function AdminParameterGroupsPage() {
  const [groups, setGroups] = useState<ParameterGroupWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingParamId, setEditingParamId] = useState<number | null>(null);
  const [groupEditValues, setGroupEditValues] = useState<Partial<ParameterGroup>>({});
  const [paramEditValues, setParamEditValues] = useState<Partial<Parameter>>({});
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ name: '', internal_name: '', description: '' });
  const [addingParamToGroup, setAddingParamToGroup] = useState<number | null>(null);
  const [newParamData, setNewParamData] = useState({ name: '', price_modifier: 0, description: '' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Handle hash navigation
    if (window.location.hash) {
      const groupId = window.location.hash.replace('#group-', '');
      const element = document.getElementById(`group-${groupId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        // Auto-expand the group
        setGroups((prev) =>
          prev.map((g) => (g.id === parseInt(groupId) ? { ...g, isExpanded: true } : g))
        );
      }
    }
  }, [groups.length]);

  const fetchData = async () => {
    try {
      const groupsData = await getParameterGroups();

      const groupsWithDetails = await Promise.all(
        groupsData.map(async (group) => {
          const [parameters, products] = await Promise.all([
            getParameters(group.id),
            getProductsUsingParameterGroup(group.id),
          ]);

          return {
            ...group,
            parameters,
            products,
            isExpanded: false,
          };
        })
      );

      setGroups(groupsWithDetails);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (groupId: number) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g))
    );
  };

  const startEditingGroup = (group: ParameterGroup) => {
    setEditingGroupId(group.id);
    setGroupEditValues({
      name: group.name,
      internal_name: group.internal_name || '',
      description: group.description || '',
    });
  };

  const saveGroupEdit = async (groupId: number) => {
    try {
      await updateParameterGroup(groupId, groupEditValues);
      await fetchData();
      setEditingGroupId(null);
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Failed to update group');
    }
  };

  const handleCloneGroup = async (groupId: number) => {
    try {
      await cloneParameterGroup(groupId);
      await fetchData();
      alert('Parameter group cloned successfully');
    } catch (error) {
      console.error('Error cloning group:', error);
      alert('Failed to clone group');
    }
  };

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!confirm(`Are you sure you want to delete "${groupName}"? This will delete all parameters and unlink from products.`)) {
      return;
    }

    try {
      await deleteParameterGroup(groupId);
      await fetchData();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.name.trim()) {
      alert('Please enter a group name');
      return;
    }

    try {
      await createParameterGroup({
        name: newGroupData.name,
        internal_name: newGroupData.internal_name || newGroupData.name,
        description: newGroupData.description,
      });
      await fetchData();
      setShowNewGroupForm(false);
      setNewGroupData({ name: '', internal_name: '', description: '' });
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    }
  };

  const startEditingParam = (param: Parameter) => {
    setEditingParamId(param.id);
    setParamEditValues({
      name: param.name,
      description: param.description || '',
      price_modifier: param.price_modifier,
    });
  };

  const saveParamEdit = async (paramId: number) => {
    try {
      await updateParameter(paramId, paramEditValues);
      await fetchData();
      setEditingParamId(null);
    } catch (error) {
      console.error('Error updating parameter:', error);
      alert('Failed to update parameter');
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

  const handleAddParameter = async (groupId: number) => {
    if (!newParamData.name.trim()) {
      alert('Please enter a parameter name');
      return;
    }

    try {
      await createParameter({
        parameter_group_id: groupId,
        name: newParamData.name,
        description: newParamData.description,
        price_modifier: newParamData.price_modifier,
      });
      await fetchData();
      setAddingParamToGroup(null);
      setNewParamData({ name: '', price_modifier: 0, description: '' });
    } catch (error) {
      console.error('Error creating parameter:', error);
      alert('Failed to create parameter');
    }
  };

  // Group by display name to show visual grouping
  const groupsByDisplayName = groups.reduce((acc, group) => {
    const displayName = group.name;
    if (!acc[displayName]) {
      acc[displayName] = [];
    }
    acc[displayName].push(group);
    return acc;
  }, {} as Record<string, ParameterGroupWithDetails[]>);

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Parameter Groups</h1>
              <p className="text-gray-600 mt-2">Manage parameter groups and their parameters</p>
            </div>
            <button
              onClick={() => setShowNewGroupForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Create Group
            </button>
          </div>

          {/* New Group Form */}
          {showNewGroupForm && (
            <div className="mb-6 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Parameter Group</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newGroupData.name}
                    onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                    placeholder="e.g., Height, Color, Width"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Name <span className="text-gray-500">(admin only)</span>
                  </label>
                  <input
                    type="text"
                    value={newGroupData.internal_name}
                    onChange={(e) => setNewGroupData({ ...newGroupData, internal_name: e.target.value })}
                    placeholder="e.g., Height Base, Height Special"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newGroupData.description}
                  onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleCreateGroup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewGroupForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading parameter groups...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupsByDisplayName).map(([displayName, groupsInName]) => (
                <div key={displayName} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {groupsInName.length > 1 && (
                    <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2">
                      <p className="text-sm text-yellow-800">
                        <strong>{groupsInName.length} parameter groups</strong> share the display name "{displayName}". They will be visually grouped for customers.
                      </p>
                    </div>
                  )}

                  {groupsInName.map((group) => (
                    <div key={group.id} id={`group-${group.id}`} className="border-b border-gray-200 last:border-b-0">
                      {/* Group Header */}
                      <div className="px-6 py-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {editingGroupId === group.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={groupEditValues.name || ''}
                                  onChange={(e) => setGroupEditValues({ ...groupEditValues, name: e.target.value })}
                                  placeholder="Display Name"
                                  className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                  type="text"
                                  value={groupEditValues.internal_name || ''}
                                  onChange={(e) => setGroupEditValues({ ...groupEditValues, internal_name: e.target.value })}
                                  placeholder="Internal Name (admin only)"
                                  className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <textarea
                                  value={groupEditValues.description || ''}
                                  onChange={(e) => setGroupEditValues({ ...groupEditValues, description: e.target.value })}
                                  placeholder="Description"
                                  rows={2}
                                  className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              </div>
                            ) : (
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                                {group.internal_name && group.internal_name !== group.name && (
                                  <p className="text-sm text-gray-500 mt-1">Internal: {group.internal_name}</p>
                                )}
                                {group.description && (
                                  <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                  <span>{group.parameters.length} parameters</span>
                                  <span>•</span>
                                  <Link
                                    href={`/admin/products?group=${group.id}`}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    {group.products.length} products using this
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {editingGroupId === group.id ? (
                              <>
                                <button
                                  onClick={() => saveGroupEdit(group.id)}
                                  className="text-green-600 hover:text-green-800 text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingGroupId(null)}
                                  className="text-gray-600 hover:text-gray-800 text-sm"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleExpand(group.id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  {group.isExpanded ? 'Collapse' : 'Expand'}
                                </button>
                                <button
                                  onClick={() => startEditingGroup(group)}
                                  className="text-gray-600 hover:text-gray-800 text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleCloneGroup(group.id)}
                                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                                >
                                  Clone
                                </button>
                                <button
                                  onClick={() => handleDeleteGroup(group.id, group.name)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {group.isExpanded && (
                        <div className="px-6 py-4">
                          {/* Products using this group */}
                          {group.products.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-900 mb-2">Products using this group:</h4>
                              <div className="flex flex-wrap gap-2">
                                {group.products.map((product) => (
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

                          {/* Parameters */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">Parameters</h4>
                              <button
                                onClick={() => setAddingParamToGroup(group.id)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                + Add Parameter
                              </button>
                            </div>

                            {/* Add Parameter Form */}
                            {addingParamToGroup === group.id && (
                              <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
                                <div className="grid grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    value={newParamData.name}
                                    onChange={(e) => setNewParamData({ ...newParamData, name: e.target.value })}
                                    placeholder="Name"
                                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                                  />
                                  <input
                                    type="number"
                                    value={newParamData.price_modifier}
                                    onChange={(e) => setNewParamData({ ...newParamData, price_modifier: parseFloat(e.target.value) })}
                                    placeholder="Price modifier"
                                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                                  />
                                  <input
                                    type="text"
                                    value={newParamData.description}
                                    onChange={(e) => setNewParamData({ ...newParamData, description: e.target.value })}
                                    placeholder="Description"
                                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleAddParameter(group.id)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                  >
                                    Add
                                  </button>
                                  <button
                                    onClick={() => setAddingParamToGroup(null)}
                                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Parameters List */}
                            {group.parameters.length > 0 ? (
                              <div className="space-y-2">
                                {group.parameters.map((param) => (
                                  <div key={param.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                    {editingParamId === param.id ? (
                                      <div className="flex-1 grid grid-cols-3 gap-2">
                                        <input
                                          type="text"
                                          value={paramEditValues.name || ''}
                                          onChange={(e) => setParamEditValues({ ...paramEditValues, name: e.target.value })}
                                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                        <input
                                          type="number"
                                          value={paramEditValues.price_modifier || 0}
                                          onChange={(e) => setParamEditValues({ ...paramEditValues, price_modifier: parseFloat(e.target.value) })}
                                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                        <input
                                          type="text"
                                          value={paramEditValues.description || ''}
                                          onChange={(e) => setParamEditValues({ ...paramEditValues, description: e.target.value })}
                                          placeholder="Description"
                                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex-1">
                                        <span className="font-medium text-gray-900">{param.name}</span>
                                        <span className="mx-2 text-gray-400">•</span>
                                        <span className="text-gray-700">₮{param.price_modifier >= 0 ? '+' : ''}{param.price_modifier.toLocaleString()}</span>
                                        {param.description && (
                                          <span className="ml-2 text-sm text-gray-500">({param.description})</span>
                                        )}
                                      </div>
                                    )}
                                    <div className="flex gap-2 ml-4">
                                      {editingParamId === param.id ? (
                                        <>
                                          <button
                                            onClick={() => saveParamEdit(param.id)}
                                            className="text-green-600 hover:text-green-800 text-sm"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => setEditingParamId(null)}
                                            className="text-gray-600 hover:text-gray-800 text-sm"
                                          >
                                            Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => startEditingParam(param)}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteParam(param.id, param.name)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                          >
                                            Delete
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No parameters yet.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {groups.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No parameter groups found. Create one to get started.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminRouteGuard>
  );
}
