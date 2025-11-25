'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import AdminNav from '@/components/AdminNav';
import { getOrderById, getOrderItems, updateOrderStatus, getHistoryForEntity } from '@/lib/api';
import { useAdminAuth } from '@/hooks/useAuth';
import type { Order, OrderItem, HistoryWithUser, OrderSnapshot } from '@/types/database';

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = parseInt(params.id as string);
  const { admin } = useAdminAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<HistoryWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Print font size constants
  const PRINT_FONT_BIG = '14pt';
  const PRINT_FONT_SMALL = '11pt';

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const orderData = await getOrderById(orderId);
      if (!orderData) {
        alert('Order not found');
        router.push('/admin/orders');
        return;
      }
      setOrder(orderData);

      // Fetch order items and history in parallel
      const promises = [
        getOrderItems(orderId).then(setItems),
        getHistoryForEntity('order', orderId).then((historyData) => {
          console.log('History data received:', historyData);
          setHistory(historyData);
        })
      ];

      await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus, admin?.id);
      fetchOrderDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'created': 'Order Created',
      'status_changed': 'Status Changed',
      'updated': 'Order Updated',
      'note_added': 'Note Added',
    };
    return labels[action] || action;
  };

  const calculateItemPrice = (item: OrderItem) => {
    // Use the pre-calculated line_total from snapshot
    return item.line_total;
  };

  const getParametersText = (item: OrderItem) => {
    if (!item.parameters || item.parameters.length === 0) return '';

    // Format parameters as "Group: Name" pairs
    return item.parameters.map(p => `${p.group}: ${p.name}`).join(', ');
  };

  const getParametersForPrint = (item: OrderItem) => {
    if (!item.parameters || item.parameters.length === 0) return [];

    // Convert OrderItemParameter[] to print format
    return item.parameters.map(p => ({
      name: p.group,
      value: p.name
    }));
  };

  if (loading) {
    return (
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </AdminRouteGuard>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <AdminRouteGuard>
      <style dangerouslySetInnerHTML={{
        __html: `
          @page {
            margin: 5mm;
            size: auto;
          }
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .print-only {
              display: table-cell !important;
            }
            body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            html, body {
              height: auto !important;
              overflow: visible !important;
            }
            header, footer, nav, .header, .footer {
              display: none !important;
            }
          }
          @media screen {
            .print-only {
              display: none !important;
            }
          }
        `
      }} />

      {/* Screen View */}
      <div className="min-h-screen bg-gray-50 no-print">
        <AdminNav />

        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <Link
              href="/admin/orders"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Orders
            </Link>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>

          <div className="bg-white border border-gray-300 p-4">
            {/* Header - Compact */}
            <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between mb-4 pb-3 border-b border-gray-300 gap-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Order #{order.id}</h1>
                <p className="text-xs text-gray-600 mt-1">
                  Created: {formatDateShort(order.created_at)} | Updated: {formatDateShort(order.updated_at)}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xs text-gray-600 mb-1">Status:</div>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`text-xs px-2 py-1 rounded border-0 font-semibold cursor-pointer ${getStatusColor(order.status)}`}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Customer Info - Compact */}
            <div className="mb-4 pb-3 border-b border-gray-300">
              <h2 className="text-sm font-bold text-gray-900 mb-2">Customer</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>
                  <span className="text-gray-600">Name:</span> <span className="font-medium">{order.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span> <span className="font-medium">{order.phone}</span>
                  {order.secondary_phone && (
                    <span className="text-gray-600"> / {order.secondary_phone}</span>
                  )}
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Address:</span> <span className="font-medium">{order.address}</span>
                </div>
              </div>
            </div>

            {/* Items - Compact Table */}
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-900 mb-2">Items</h2>
              {items.length === 0 ? (
                <p className="text-xs text-gray-600">No items</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-1 font-semibold text-gray-700">Product</th>
                      <th className="text-left py-1 font-semibold text-gray-700">Options</th>
                      <th className="text-center py-1 font-semibold text-gray-700">Qty</th>
                      <th className="text-right py-1 font-semibold text-gray-700">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-1.5 align-top">
                          <div className="font-medium">{item.product_name}</div>
                        </td>
                        <td className="py-1.5 align-top text-gray-600">
                          {getParametersText(item) || '-'}
                        </td>
                        <td className="py-1.5 align-top text-center">{item.quantity}</td>
                        <td className="py-1.5 align-top text-right font-medium">
                          ₮{calculateItemPrice(item).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Total - Compact */}
            <div className="flex justify-end mb-4 pb-4 border-b border-gray-300">
              <div className="w-48">
                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₮{order.total_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-600">Delivery:</span>
                  <span className="font-medium">₮0</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-300">
                  <span>Total:</span>
                  <span>₮{order.total_price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* History - Compact */}
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-2">History</h2>
              {history.length === 0 ? (
                <p className="text-xs text-gray-600">No history recorded</p>
              ) : (
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div key={entry.id} className="border-l-2 border-blue-500 pl-3 py-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-900">
                            {getActionLabel(entry.action)}
                          </div>
                          {entry.field_name && (
                            <div className="text-xs text-gray-600 mt-0.5">
                              {entry.field_name}:
                              {entry.old_value && (
                                <span className="text-red-600"> {entry.old_value}</span>
                              )}
                              {entry.old_value && entry.new_value && ' → '}
                              {entry.new_value && (
                                <span className="text-green-600"> {entry.new_value}</span>
                              )}
                            </div>
                          )}
                          {entry.notes && (
                            <div className="text-xs text-gray-600 mt-0.5 italic">
                              {entry.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-3">
                          <div className="text-xs text-gray-500">
                            {formatDateTime(entry.created_at)}
                          </div>
                          {entry.changed_by_admin && (
                            <div className="text-xs text-blue-600 font-medium">
                              Admin: {entry.changed_by_admin.username}
                            </div>
                          )}
                          {!entry.changed_by_admin && entry.changed_by && (
                            <div className="text-xs text-gray-600 font-medium">
                              Customer: {entry.changed_by.phone}
                            </div>
                          )}
                          {!entry.changed_by_admin && !entry.changed_by && entry.changed_by_admin_id && (
                            <div className="text-xs text-blue-600 font-medium">
                              Admin ID: {entry.changed_by_admin_id}
                            </div>
                          )}
                          {!entry.changed_by_admin && !entry.changed_by && entry.changed_by_user_id && (
                            <div className="text-xs text-gray-600 font-medium">
                              User ID: {entry.changed_by_user_id}
                            </div>
                          )}
                          {!entry.changed_by_admin && !entry.changed_by && !entry.changed_by_admin_id && !entry.changed_by_user_id && (
                            <div className="text-xs text-gray-500 italic">
                              System
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print View Only */}
      <div style={{ display: 'none' }} className="print-view">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .print-view {
                display: block !important;
                padding: 5mm;
              }
            }
          `
        }} />

        <div className="bg-white border border-gray-300" style={{ padding: '8px' }}>
          {/* Header - Compact */}
          <div className="flex items-start justify-between pb-2 border-b border-gray-300" style={{ marginBottom: '8px' }}>
            <div>
              <h1 style={{ fontSize: PRINT_FONT_BIG, fontWeight: 'bold', margin: 0 }}>Order #{order.id}</h1>
              <p style={{ fontSize: PRINT_FONT_SMALL, color: '#666', margin: '2px 0 0 0' }}>
                Created: {formatDateShort(order.created_at)} | Updated: {formatDateShort(order.updated_at)}
              </p>
            </div>
            <div className="text-right">
              <div style={{ fontSize: PRINT_FONT_SMALL, color: '#666', marginBottom: '2px' }}>Status:</div>
              <span style={{ fontSize: PRINT_FONT_SMALL, padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }} className={getStatusColor(order.status)}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Customer Info - Compact */}
          <div className="pb-2 border-b border-gray-300" style={{ marginBottom: '8px' }}>
            <h2 style={{ fontSize: PRINT_FONT_SMALL, fontWeight: 'bold', margin: '0 0 4px 0' }}>Customer</h2>
            <div className="grid grid-cols-2" style={{ gap: '4px', fontSize: PRINT_FONT_SMALL }}>
              <div>
                <span style={{ color: '#666' }}>Name:</span> <span style={{ fontSize: PRINT_FONT_BIG, fontWeight: 'bold' }}>{order.name}</span>
              </div>
              <div>
                <span style={{ color: '#666' }}>Phone:</span> <span style={{ fontSize: PRINT_FONT_BIG, fontWeight: 'bold' }}>{order.phone}</span>
                {order.secondary_phone && (
                  <span style={{ fontSize: PRINT_FONT_BIG, fontWeight: 'bold' }}> / {order.secondary_phone}</span>
                )}
              </div>
              <div className="col-span-2">
                <span style={{ color: '#666' }}>Address:</span> <span style={{ fontWeight: '500' }}>{order.address}</span>
              </div>
            </div>
          </div>

          {/* Items - Compact Table with Checkboxes */}
          <div>
            <h2 style={{ fontSize: PRINT_FONT_SMALL, fontWeight: 'bold', margin: '0 0 4px 0' }}>Items</h2>
            {items.length === 0 ? (
              <p style={{ fontSize: PRINT_FONT_SMALL, color: '#666' }}>No items</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left font-semibold text-gray-700" style={{ fontSize: PRINT_FONT_SMALL, padding: '2px 0', width: '30px' }}></th>
                    <th className="text-left font-semibold text-gray-700" style={{ fontSize: PRINT_FONT_SMALL, padding: '2px 0' }}>Product</th>
                    <th className="text-left font-semibold text-gray-700" style={{ fontSize: PRINT_FONT_SMALL, padding: '2px 0' }}>Options</th>
                    <th className="text-center font-semibold text-gray-700" style={{ fontSize: PRINT_FONT_SMALL, padding: '2px 0' }}>Qty</th>
                    <th className="text-center font-semibold text-gray-700" style={{ fontSize: PRINT_FONT_SMALL, padding: '2px 0', width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const params = getParametersForPrint(item);
                    return (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="align-top" style={{ padding: '4px 4px 4px 0', fontSize: PRINT_FONT_SMALL }}>{index + 1}.</td>
                        <td className="align-top" style={{ padding: '4px 0' }}>
                          <div style={{ fontSize: PRINT_FONT_BIG, fontWeight: 'bold' }}>{item.product_name}</div>
                        </td>
                        <td className="align-top" style={{ padding: '4px 0' }}>
                          {params.length === 0 ? (
                            <span style={{ color: '#666', fontSize: PRINT_FONT_SMALL }}>-</span>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {params.map((param, idx) => (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ fontSize: PRINT_FONT_SMALL, color: '#666' }}>{param.name}</div>
                                  <div style={{ fontSize: PRINT_FONT_SMALL, fontWeight: 'bold' }}>{param.value}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="align-top text-center" style={{ padding: '4px 0', fontSize: PRINT_FONT_BIG, fontWeight: 'bold' }}>{item.quantity}</td>
                        <td className="align-top text-center" style={{ padding: '4px 0' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '42px',
                            height: '42px',
                            border: '3px solid #000',
                            backgroundColor: 'white'
                          }}></span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
