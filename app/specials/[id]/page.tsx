'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { getSpecialImageUrl, getImageUrl } from '@/lib/storage-client';
import { calculateProductPrice } from '@/lib/api-client';
import { PageContainer, LoadingState } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from '@/components/Image';
import Cart from '@/components/Cart';
import { ArrowLeft, ShoppingCart, Check, Package, Tag } from 'lucide-react';
import type { SpecialWithItems, ProductWithDetails, ParameterSelection } from '@/types/database';

interface SpecialItemWithDetails {
  id: number;
  special_id: number;
  product_id: number;
  quantity: number;
  selected_parameters: ParameterSelection | null;
  product?: { id: number; name: string };
  productDetails?: ProductWithDetails | null;
}

interface SpecialWithItemDetails extends Omit<SpecialWithItems, 'items'> {
  items?: SpecialItemWithDetails[];
}

interface SpecialDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SpecialDetailPage({ params }: SpecialDetailPageProps) {
  const { id } = use(params);
  const specialId = parseInt(id);
  const router = useRouter();
  const { t } = useTranslation();
  const { addSpecialToCart } = useCart();

  const [special, setSpecial] = useState<SpecialWithItemDetails | null>(null);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpecial() {
      try {
        setLoading(true);
        setError(null);

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const response = await fetch(`${baseUrl}/api/specials/${specialId}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('not-found');
          } else {
            setError('failed');
          }
          return;
        }

        const data = await response.json();
        setSpecial(data.special);
        setOriginalPrice(data.originalPrice || 0);
      } catch (err) {
        console.error('Error loading special:', err);
        setError('failed');
      } finally {
        setLoading(false);
      }
    }

    if (!isNaN(specialId)) {
      loadSpecial();
    } else {
      setError('invalid');
      setLoading(false);
    }
  }, [specialId]);

  const handleAddToCart = async () => {
    if (!special) return;

    setIsAdding(true);
    setAddError(null);

    try {
      await addSpecialToCart(special.id);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (err) {
      console.error('Error adding special to cart:', err);
      setAddError(t('products.error-add-to-cart'));
    } finally {
      setIsAdding(false);
    }
  };

  // Helper to get parameter name from selection
  const getParameterName = (
    productDetails: ProductWithDetails | null | undefined,
    paramGroupId: string | number,
    paramId: number
  ): string | null => {
    if (!productDetails?.parameter_groups) return null;

    const paramGroup = productDetails.parameter_groups.find(
      pg => pg.parameter_group_id === Number(paramGroupId)
    );
    if (!paramGroup) return null;

    const param = paramGroup.parameters?.find(p => p.id === paramId);
    return param?.name || null;
  };

  // Helper to get parameter group name
  const getParameterGroupName = (
    productDetails: ProductWithDetails | null | undefined,
    paramGroupId: string | number
  ): string | null => {
    if (!productDetails?.parameter_groups) return null;

    const paramGroup = productDetails.parameter_groups.find(
      pg => pg.parameter_group_id === Number(paramGroupId)
    );
    return paramGroup?.parameter_group?.name || null;
  };

  // Calculate item price with selected parameters
  const calculateItemPrice = (item: SpecialItemWithDetails): number => {
    if (!item.productDetails) {
      return item.product?.id ? 0 : 0;
    }

    const selection = (item.selected_parameters || {}) as ParameterSelection;
    return calculateProductPrice(item.productDetails, selection);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !special) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-16">
          <Package className="h-16 w-16 text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('specials.not-found')}
          </h1>
          <p className="text-gray-600 mb-8">
            {t('specials.not-found-description')}
          </p>
          <Button onClick={() => router.push('/specials')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('specials.back-to-specials')}
          </Button>
        </div>
      </PageContainer>
    );
  }

  const savings = originalPrice - special.discounted_price;
  const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  return (
    <>
      <PageContainer className="pb-[calc(40vh+2rem)]">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/specials"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('specials.back-to-specials')}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Special Image */}
          <div>
            <Card className="relative overflow-hidden aspect-square bg-gray-100">
              <Image
                src={special.picture_url ? getSpecialImageUrl(special.picture_url) : null}
                alt={special.name}
                className="w-full h-full object-cover"
              />
              {savingsPercent > 0 && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-white px-4 py-2 text-lg font-bold shadow-lg">
                    {t('specials.save-percent').replace('{percent}', savingsPercent.toString())}
                  </Badge>
                </div>
              )}
            </Card>
          </div>

          {/* Special Info */}
          <div className="space-y-6">
            {/* Badge */}
            <Badge className="bg-primary/10 text-primary">
              <Tag className="mr-1 h-3 w-3" />
              {t('home.specials.title')}
            </Badge>

            {/* Special name */}
            <h1 className="text-3xl font-bold text-gray-900">
              {special.name}
            </h1>

            {/* Description */}
            {special.description && (
              <p className="text-gray-600 leading-relaxed">
                {special.description}
              </p>
            )}

            {/* Price display */}
            <div className="border-t border-b py-4 space-y-2">
              {originalPrice > 0 && (
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{t('specials.original-price')}</span>
                  <span className="line-through">₮{originalPrice.toLocaleString()}</span>
                </div>
              )}
              {savings > 0 && (
                <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                  <span>{t('specials.you-save')}</span>
                  <span>₮{savings.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xl font-bold">
                <span>{t('specials.bundle-price')}</span>
                <span className="text-primary">₮{special.discounted_price.toLocaleString()}</span>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <Button
                onClick={handleAddToCart}
                disabled={isAdding || isAdded}
                size="lg"
                className="w-full bg-secondary hover:bg-secondary/90"
              >
                {isAdded && <Check className="mr-2 h-5 w-5" />}
                {!isAdded && !isAdding && <ShoppingCart className="mr-2 h-5 w-5" />}
                {isAdding ? t('specials.adding') : isAdded ? t('specials.added') : t('specials.add-bundle')}
              </Button>

              {addError && (
                <p className="text-sm text-red-600 text-center">{addError}</p>
              )}

              <p className="text-sm text-gray-500 text-center">
                {t('specials.bundle-note')}
              </p>
            </div>
          </div>
        </div>

        {/* Products included in this special */}
        {special.items && special.items.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('specials.whats-included')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {special.items.map((item) => {
                const productDetails = item.productDetails;
                const productImage = productDetails?.images?.[0];
                const itemPrice = calculateItemPrice(item);
                const itemTotal = itemPrice * item.quantity;

                return (
                  <Card key={item.id} className="overflow-hidden">
                    {/* Product Image */}
                    <div className="aspect-video bg-gray-100 relative">
                      <Image
                        src={productImage ? getImageUrl(productImage.medium_path) : null}
                        alt={productDetails?.name || item.product?.name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-white/90 text-gray-900">
                          x{item.quantity}
                        </Badge>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {productDetails?.name || item.product?.name || 'Product'}
                        </h3>
                        {productDetails?.category && (
                          <p className="text-sm text-gray-500">
                            {productDetails.category.name}
                          </p>
                        )}
                      </div>

                      {/* Selected Parameters */}
                      {item.selected_parameters && Object.keys(item.selected_parameters).length > 0 && (
                        <div className="space-y-1">
                          {Object.entries(item.selected_parameters).map(([groupId, paramId]) => {
                            const groupName = getParameterGroupName(productDetails, groupId);
                            const paramName = getParameterName(productDetails, groupId, paramId as number);
                            if (!groupName || !paramName) return null;

                            return (
                              <div key={groupId} className="flex text-sm">
                                <span className="text-gray-500">{groupName}:</span>
                                <span className="ml-1 text-gray-700">{paramName}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-gray-500">
                          {item.quantity > 1
                            ? `₮${itemPrice.toLocaleString()} x ${item.quantity}`
                            : t('common.price')
                          }
                        </span>
                        <span className="font-semibold text-gray-900">
                          ₮{itemTotal.toLocaleString()}
                        </span>
                      </div>

                      {/* Link to product */}
                      {productDetails && (
                        <Link
                          href={`/products/${productDetails.id}`}
                          className="block text-center text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                          {t('product.view-details')} →
                        </Link>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Total Summary */}
            <Card className="mt-6 p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">
                    {t('specials.items-total').replace('{count}', special.items.length.toString())}
                  </p>
                  {originalPrice > 0 && (
                    <p className="text-gray-500">
                      <span className="line-through">₮{originalPrice.toLocaleString()}</span>
                      {savings > 0 && (
                        <span className="ml-2 text-green-600 font-medium">
                          {t('specials.save-amount').replace('{amount}', savings.toLocaleString())}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{t('specials.bundle-price')}</p>
                  <p className="text-3xl font-bold text-primary">
                    ₮{special.discounted_price.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </PageContainer>

      {/* Sticky Cart at Bottom */}
      <Cart compact sticky />
    </>
  );
}
