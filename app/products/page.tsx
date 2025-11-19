'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getCategories,
  getAllProductsWithDetails,
  calculateProductPrice,
} from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import type {
  Category,
  ProductWithDetails,
  ParameterSelection,
} from '@/types/database';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items, total, addToCart, updateCartItem, removeFromCart, loading: cartLoading } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedParameters, setSelectedParameters] = useState<ParameterSelection>({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cats, prods] = await Promise.all([
          getCategories(),
          getAllProductsWithDetails(),
        ]);

        setCategories(cats);
        setProducts(prods);

        // Set initial selections from URL params
        const categoryParam = searchParams.get('category');
        const productParam = searchParams.get('product');

        if (categoryParam) {
          const catId = parseInt(categoryParam);
          setSelectedCategoryId(catId);
        }

        if (productParam) {
          const prodId = parseInt(productParam);
          setSelectedProductId(prodId);
          const product = prods.find((p) => p.id === prodId);
          if (product) {
            setSelectedCategoryId(product.category_id);
            initializeDefaultParameters(product);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [searchParams]);

  const initializeDefaultParameters = (product: ProductWithDetails) => {
    const defaults: ParameterSelection = {};
    product.parameter_groups?.forEach((pg) => {
      if (pg.default_parameter_id) {
        defaults[pg.parameter_group_id] = pg.default_parameter_id;
      }
    });
    setSelectedParameters(defaults);
  };

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return products.filter((p) => p.category_id === selectedCategoryId);
  }, [products, selectedCategoryId]);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const calculatedPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    return calculateProductPrice(selectedProduct, selectedParameters);
  }, [selectedProduct, selectedParameters]);

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedProductId(null);
    setSelectedParameters({});
  };

  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId);
    const product = products.find((p) => p.id === productId);
    if (product) {
      initializeDefaultParameters(product);
    }
  };

  const handleParameterChange = (paramGroupId: number, paramId: number) => {
    setSelectedParameters((prev) => ({
      ...prev,
      [paramGroupId]: paramId,
    }));
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    try {
      await addToCart(selectedProduct.id, quantity, selectedParameters);
      alert('Added to cart!');
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    }
  };

  const handleUpdateCartItem = async (
    itemId: number,
    newQuantity?: number,
    newParameters?: ParameterSelection
  ) => {
    try {
      await updateCartItem(itemId, newQuantity, newParameters);
    } catch (error) {
      console.error('Error updating cart item:', error);
      alert('Failed to update cart item');
    }
  };

  const handleRemoveFromCart = async (itemId: number) => {
    if (!confirm('Remove this item from cart?')) return;

    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert('Failed to remove from cart');
    }
  };

  const getItemPrice = (item: typeof items[0]) => {
    if (!item.product) return 0;
    const params = (item.selected_parameters as ParameterSelection) || {};
    return calculateProductPrice(item.product, params) * item.quantity;
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
            <Link href="/" className="text-3xl font-bold text-gray-900 hover:text-blue-600">
              EzBox.mn
            </Link>
            <div className="flex gap-4">
              <Link
                href="/"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Product Configuration Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Configure Product</h2>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Configuration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  {/* Category Selection */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`px-3 py-2 text-sm rounded text-left transition ${
                            selectedCategoryId === cat.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* Product Selection */}
                  <td className="px-6 py-4 align-top">
                    {selectedCategoryId ? (
                      <div className="flex flex-col gap-2">
                        {filteredProducts.map((prod) => (
                          <button
                            key={prod.id}
                            onClick={() => handleProductSelect(prod.id)}
                            className={`px-3 py-2 text-sm rounded text-left transition ${
                              selectedProductId === prod.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div>{prod.name}</div>
                            <div className="text-xs opacity-75">
                              ₮{prod.base_price.toLocaleString()}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Select a category first</div>
                    )}
                  </td>

                  {/* Parameter Configuration */}
                  <td className="px-6 py-4 align-top">
                    {selectedProduct ? (
                      <div className="flex flex-wrap gap-4">
                        {selectedProduct.parameter_groups?.map((pg) => (
                          <div key={pg.parameter_group_id} className="flex flex-col">
                            <label className="text-xs font-medium text-gray-700 mb-1">
                              {pg.parameter_group?.name}
                            </label>
                            <select
                              value={selectedParameters[pg.parameter_group_id] || ''}
                              onChange={(e) =>
                                handleParameterChange(
                                  pg.parameter_group_id,
                                  parseInt(e.target.value)
                                )
                              }
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {pg.parameters?.map((param) => (
                                <option key={param.id} value={param.id}>
                                  {param.name}
                                  {param.price_modifier !== 0 &&
                                    ` (${param.price_modifier > 0 ? '+' : ''}₮${param.price_modifier.toLocaleString()})`}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Select a product first</div>
                    )}
                  </td>

                  {/* Quantity */}
                  <td className="px-6 py-4 align-top">
                    {selectedProduct && (
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 align-top">
                    {selectedProduct && (
                      <div className="text-lg font-semibold text-gray-900">
                        ₮{(calculatedPrice * quantity).toLocaleString()}
                      </div>
                    )}
                  </td>

                  {/* Add to Cart */}
                  <td className="px-6 py-4 align-top">
                    {selectedProduct && (
                      <button
                        onClick={handleAddToCart}
                        className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                      >
                        Add to Cart
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Cart Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h2>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Your cart is empty</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Configuration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.product?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Base: ₮{item.product?.base_price.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {item.product?.parameter_groups?.map((pg) => {
                            const selections = (item.selected_parameters as ParameterSelection) || {};
                            const selectedParamId = selections[pg.parameter_group_id];
                            const selectedParam = pg.parameters?.find(
                              (p) => p.id === selectedParamId
                            );

                            return (
                              <div key={pg.parameter_group_id} className="text-xs">
                                <span className="font-medium text-gray-700">
                                  {pg.parameter_group?.name}:
                                </span>{' '}
                                <span className="text-gray-600">
                                  {selectedParam?.name || 'Default'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateCartItem(
                              item.id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          ₮{getItemPrice(item).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-4 text-right font-semibold">
                      Total:
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xl font-bold text-gray-900">
                        ₮{total.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => alert('Checkout functionality coming soon!')}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                      >
                        Checkout
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
