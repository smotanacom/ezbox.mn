'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cart from '@/components/Cart';
import { PageContainer, PageTitle, EmptyState, LoadingState } from '@/components/layout';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingCart, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { items, loading } = useCart();

  return (
    <PageContainer>
      <PageTitle icon={ShoppingCart}>Shopping Cart</PageTitle>

      {loading && items.length === 0 ? (
        <LoadingState text="Loading your cart..." fullScreen={false} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add some products to get started"
          action={
            <Button asChild size="lg">
              <Link href="/products">Start Shopping</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Cart showCheckoutButton={false} />
          <Card className="mt-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Button asChild variant="outline" size="lg">
                <Link href="/products">Continue Shopping</Link>
              </Button>
              <Button
                onClick={() => router.push('/checkout')}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                Proceed to Checkout
              </Button>
            </div>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
