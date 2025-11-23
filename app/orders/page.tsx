'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getUserOrders } from '@/lib/api';
import { useTranslation } from '@/contexts/LanguageContext';
import { PageContainer, PageTitle, EmptyState, LoadingState } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, ShoppingBag, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Order } from '@/types/database';

export default function OrdersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrders() {
      const user = getCurrentUser();

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const userOrders = await getUserOrders(user.id);
        setOrders(userOrders);
      } catch (err) {
        console.error('Error loading orders:', err);
        setError(t('orders.failed-to-load'));
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{t('orders.status.pending')}</Badge>;
      case 'processing':
        return <Badge variant="default" className="gap-1"><Package className="h-3 w-3" />{t('orders.status.processing')}</Badge>;
      case 'completed':
        return <Badge variant="default" className="gap-1 bg-secondary hover:bg-secondary/90"><CheckCircle className="h-3 w-3" />{t('orders.status.completed')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{t('orders.status.cancelled')}</Badge>;
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

  return (
    <>
      <PageContainer>
        <div className="flex items-center justify-between mb-8">
          <PageTitle icon={Package}>{t('orders.title')}</PageTitle>
        <Button asChild variant="outline" size="lg">
          <Link href="/products">{t('orders.continue-shopping')}</Link>
        </Button>
      </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={t('orders.no-orders')}
            description={t('orders.no-orders-description')}
            action={
              <Button asChild size="lg">
                <Link href="/products">{t('orders.start-shopping')}</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {t('orders.order-number')} #{order.id}
                        {getStatusBadge(order.status)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {t('orders.ordered-on')} {formatDate(order.created_at!)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">₮{order.total_price.toLocaleString()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('checkout.address')}</p>
                      <p className="font-medium">{order.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('checkout.phone')}</p>
                      <p className="font-medium">{order.phone}</p>
                      {order.secondary_phone && (
                        <p className="text-sm text-muted-foreground">{order.secondary_phone}</p>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-end">
                    <Button asChild variant="outline">
                      <Link href={`/orders/${order.id}`}>
                        {t('orders.view-details')}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
