'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { orderAPI, type OrderWithItems } from '@/lib/api-client';
import Image from '@/components/Image';
import { PageContainer, LoadingState } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, ArrowLeft, Clock, CheckCircle, XCircle, MapPin, Phone } from 'lucide-react';
import type { Order, OrderItem } from '@/types/database';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = parseInt(params.id as string);
  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [items, setItems] = useState<OrderWithItems['items']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrder() {
      if (authLoading) return;

      if (!user) {
        router.replace('/login');
        return;
      }

      try {
        setLoading(true);
        const { order: orderData } = await orderAPI.getById(orderId);

        if (!orderData) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        // Check if order belongs to current user
        if (orderData.user_id !== user.id) {
          setError('You do not have permission to view this order');
          setLoading(false);
          return;
        }

        setOrder(orderData);
        setItems(orderData.items || []);
      } catch (err) {
        console.error('Error loading order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      loadOrder();
    }
  }, [orderId, user, authLoading]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'processing':
        return <Badge variant="default" className="gap-1"><Package className="h-3 w-3" />Processing</Badge>;
      case 'completed':
        return <Badge variant="default" className="gap-1 bg-secondary hover:bg-secondary/90"><CheckCircle className="h-3 w-3" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !order) {
    return (
      <PageContainer>
        <Card className="border-destructive max-w-3xl mx-auto">
          <CardContent className="p-12 text-center">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive opacity-50" />
            <h2 className="text-2xl font-bold mb-2">{error || 'Order not found'}</h2>
            <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button asChild size="lg">
              <Link href="/orders">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Order #{order.id}</h1>
              <p className="text-muted-foreground mt-1">
                Placed on {formatDate(order.created_at!)}
              </p>
            </div>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Order items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>{items.length} {items.length === 1 ? 'item' : 'items'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-24">Qty</TableHead>
                      <TableHead className="w-32 text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-16 rounded-md overflow-hidden">
                              <Image
                                src="/placeholder-product.png"
                                alt={item.product_name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div>
                              <div className="font-medium">{item.product_name}</div>
                              {item.selected_parameters && Object.keys(item.selected_parameters).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(item.selected_parameters).map(([key, value], idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {key}: {value}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₮{(item.price_at_time * item.quantity).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Order summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₮{order.total_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-semibold">Free</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold">₮{order.total_price.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Delivery Address</span>
                  </div>
                  <p className="text-sm ml-6">{order.address}</p>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Contact</span>
                  </div>
                  <p className="text-sm ml-6">{order.phone}</p>
                  {order.secondary_phone && (
                    <p className="text-sm ml-6 text-muted-foreground">{order.secondary_phone}</p>
                  )}
                </div>
                {order.name && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm font-medium">Name</span>
                      <p className="text-sm text-muted-foreground">{order.name}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
