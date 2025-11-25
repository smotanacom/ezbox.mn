'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cart from '@/components/Cart';
import { PageContainer, PageTitle, EmptyState, LoadingState } from '@/components/layout';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingCart, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { items, loading } = useCart();
  const { t } = useTranslation();

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <PageTitle icon={ShoppingCart}>{t('cart.title')}</PageTitle>
        {!loading && items.length > 0 && (
          <Button
            onClick={() => router.push('/checkout')}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            {t('cart.checkout')}
          </Button>
        )}
      </div>

      {loading && items.length === 0 ? (
        <LoadingState text={t('common.loading')} fullScreen={false} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={t('cart.empty')}
          description={t('products.select-category')}
          action={
            <Button asChild size="lg">
              <Link href="/products">{t('orders.start-shopping')}</Link>
            </Button>
          }
        />
      ) : (
        <Cart showCheckoutButton={true} />
      )}
    </PageContainer>
  );
}
