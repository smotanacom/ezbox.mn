'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCategories, getProducts, getSpecials } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import type { Category, Product, SpecialWithItems } from '@/types/database';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<number, Product[]>>({});
  const [specials, setSpecials] = useState<SpecialWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const { addSpecialToCart } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Load categories
        const cats = await getCategories();
        setCategories(cats);

        // Load products for each category
        const allProducts = await getProducts();
        const grouped: Record<number, Product[]> = {};

        for (const product of allProducts) {
          if (product.category_id) {
            if (!grouped[product.category_id]) {
              grouped[product.category_id] = [];
            }
            grouped[product.category_id].push(product);
          }
        }

        setProductsByCategory(grouped);

        // Load available specials
        const availableSpecials = await getSpecials('available');
        setSpecials(availableSpecials);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleAddSpecialToCart = async (specialId: number) => {
    try {
      await addSpecialToCart(specialId);
      alert('Special added to cart!');
    } catch (error) {
      console.error('Error adding special:', error);
      alert('Failed to add special to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">EzBox.mn</h1>
            <div className="flex gap-4">
              <Link
                href="/products"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Browse Products
              </Link>
              <Link
                href="/cart"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
              >
                Cart
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Specials Section */}
        {specials.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Special Offers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specials.map((special) => (
                <div
                  key={special.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  {special.picture_url && (
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">Image</span>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {special.name}
                    </h3>
                    {special.description && (
                      <p className="text-gray-600 mb-4">{special.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-600">
                        ₮{special.discounted_price.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleAddSpecialToCart(special.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Products by Category Table */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Products by Category</h2>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/products?category=${category.id}`}
                        className="flex flex-col items-start group"
                      >
                        {category.picture_url && (
                          <div className="w-20 h-20 bg-gray-200 rounded mb-2 flex items-center justify-center">
                            <span className="text-xs text-gray-400">Image</span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-blue-600 group-hover:text-blue-800">
                          {category.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-4">
                        {productsByCategory[category.id]?.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products?product=${product.id}`}
                            className="flex flex-col items-center group"
                          >
                            {product.picture_url && (
                              <div className="w-20 h-20 bg-gray-200 rounded mb-2 flex items-center justify-center">
                                <span className="text-xs text-gray-400">Image</span>
                              </div>
                            )}
                            <span className="text-sm text-center text-gray-700 group-hover:text-blue-600 max-w-[100px]">
                              {product.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ₮{product.base_price.toLocaleString()}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
