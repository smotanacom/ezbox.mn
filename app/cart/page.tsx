'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { calculateProductPrice } from '@/lib/api';
import type { ParameterSelection } from '@/types/database';

export default function CartPage() {
  const router = useRouter();
  const { items, total, updateCartItem, removeFromCart, loading } = useCart();

  const getItemPrice = (item: typeof items[0]) => {
    if (!item.product) return 0;
    const params = (item.selected_parameters as ParameterSelection) || {};
    return calculateProductPrice(item.product, params) * item.quantity;
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemove = async (itemId: number) => {
    if (!confirm('Remove this item from cart?')) return;
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading cart...</div>
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
              <Link
                href="/products"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Products
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-xl text-gray-600 mb-6">Your cart is empty</p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Configuration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-400">Image</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.product?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Base Price: ₮{item.product?.base_price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {item.product?.parameter_groups?.map((pg) => {
                            const selections = (item.selected_parameters as ParameterSelection) || {};
                            const selectedParamId = selections[pg.parameter_group_id];
                            const selectedParam = pg.parameters?.find(
                              (p) => p.id === selectedParamId
                            );

                            return (
                              <div key={pg.parameter_group_id} className="text-sm">
                                <span className="font-medium text-gray-700">
                                  {pg.parameter_group?.name}:
                                </span>{' '}
                                <span className="text-gray-600">
                                  {selectedParam?.name || 'Default'}
                                </span>
                                {selectedParam?.price_modifier !== 0 && selectedParam && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({selectedParam.price_modifier > 0 ? '+' : ''}₮
                                    {selectedParam.price_modifier.toLocaleString()})
                                  </span>
                                )}
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
                            handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                          }
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-semibold text-gray-900">
                          ₮{getItemPrice(item).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right text-lg font-semibold">
                      Total:
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-2xl font-bold text-gray-900">
                        ₮{total.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <Link
                href="/products"
                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
              >
                Continue Shopping
              </Link>
              <button
                onClick={() => alert('Checkout functionality coming soon!')}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-lg font-medium"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
