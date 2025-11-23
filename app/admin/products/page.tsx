'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { getAllProductsWithDetails, getCategories, updateProduct, deleteProduct } from '@/lib/api';
import type { ProductWithDetails, Category } from '@/types/database';

function AdminProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterGroupId = searchParams?.get('group');

  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<ProductWithDetails>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getAllProductsWithDetails(),
        getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (product: ProductWithDetails) => {
    setEditingId(product.id);
    setEditValues({
      name: product.name,
      description: product.description || '',
      base_price: product.base_price,
      category_id: product.category_id,
      status: product.status,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (productId: number) => {
    try {
      await updateProduct(productId, editValues);
      await fetchData();
      setEditingId(null);
      setEditValues({});
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    }
  };

  const handleDelete = async (productId: number, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This will also remove all parameter group associations.`)) {
      return;
    }

    try {
      await deleteProduct(productId);
      await fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const filteredProducts = filterGroupId
    ? products.filter(p =>
        p.parameter_groups?.some(pg => pg.parameter_group_id === parseInt(filterGroupId))
      )
    : products;

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 mt-2">
                {filterGroupId ? 'Filtered by parameter group' : 'Manage all products'}
              </p>
            </div>
            <Link
              href="/admin/products/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Add Product
            </Link>
          </div>

          {filterGroupId && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">
                Showing products using parameter group ID: {filterGroupId}
                <button
                  onClick={() => router.push('/admin/products')}
                  className="ml-4 text-blue-600 hover:text-blue-800 underline"
                >
                  Clear filter
                </button>
              </p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parameter Groups
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => {
                      const isEditing = editingId === product.id;
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editValues.name || ''}
                                onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <div>
                                <div className="font-medium">{product.name}</div>
                                {product.description && (
                                  <div className="text-gray-500 text-xs mt-1">{product.description}</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <select
                                value={editValues.category_id || ''}
                                onChange={(e) => setEditValues({ ...editValues, category_id: parseInt(e.target.value) || null })}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">No category</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span>{product.category?.name || '-'}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editValues.base_price || 0}
                                onChange={(e) => setEditValues({ ...editValues, base_price: parseFloat(e.target.value) })}
                                className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            ) : (
                              <span>₮{product.base_price.toLocaleString()}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {isEditing ? (
                              <select
                                value={editValues.status || 'active'}
                                onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="draft">Draft</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                product.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : product.status === 'inactive'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="flex flex-wrap gap-1">
                              {product.parameter_groups?.map((pg) => (
                                <Link
                                  key={pg.id}
                                  href={`/admin/parameter-groups#group-${pg.parameter_group_id}`}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 transition"
                                >
                                  {pg.parameter_group?.name}
                                </Link>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => saveEdit(product.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => startEditing(product)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </button>
                                <Link
                                  href={`/admin/products/${product.id}`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Details
                                </Link>
                                <button
                                  onClick={() => handleDelete(product.id, product.name)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
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

              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  {filterGroupId ? 'No products found with this parameter group.' : 'No products found.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminRouteGuard>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          </div>
        </div>
      </AdminRouteGuard>
    }>
      <AdminProductsContent />
    </Suspense>
  );
}
