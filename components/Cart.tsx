'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { calculateProductPrice } from '@/lib/api';
import ProductConfigRow from '@/components/ProductConfigRow';
import ProductCard from '@/components/ProductCard';
import Image from '@/components/Image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ShoppingCart, Trash2 } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import type { ParameterSelection } from '@/types/database';

interface CartProps {
  showCheckoutButton?: boolean;
  compact?: boolean;
  sticky?: boolean;
}

export default function Cart({ showCheckoutButton = true, compact = false, sticky = false }: CartProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { items, total, updateCartItem, removeFromCart, removeSpecialFromCart, loading } = useCart();
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  const [removingSpecials, setRemovingSpecials] = useState<Set<number>>(new Set());
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});
  const [isMinimized, setIsMinimized] = useState(true);
  const prevItemsLength = useRef(items.length);

  // Group items by special_id
  const specialBundles = items.filter(item => item.special_id !== null);
  const regularItems = items.filter(item => item.special_id === null);

  // Group special items by special_id
  const itemsBySpecial = specialBundles.reduce((acc, item) => {
    const specialId = item.special_id!;
    if (!acc[specialId]) {
      acc[specialId] = [];
    }
    acc[specialId].push(item);
    return acc;
  }, {} as Record<number, typeof items>);

  const handleRemoveSpecial = async (specialId: number) => {
    setRemovingSpecials(prev => new Set(prev).add(specialId));

    try {
      await removeSpecialFromCart(specialId);
    } catch (error) {
      console.error('Error removing special from cart:', error);
    } finally {
      setRemovingSpecials(prev => {
        const next = new Set(prev);
        next.delete(specialId);
        return next;
      });
    }
  };

  const getBundlePrice = (bundleItems: typeof items) => {
    return bundleItems.reduce((sum, item) => {
      if (!item.product) return sum;
      const params = (item.selected_parameters as ParameterSelection) || {};
      return sum + (calculateProductPrice(item.product, params) * item.quantity);
    }, 0);
  };

  // Expand cart when items are added
  useEffect(() => {
    if (items.length > prevItemsLength.current && isMinimized) {
      setIsMinimized(false);
    }
    prevItemsLength.current = items.length;
  }, [items.length, isMinimized]);

  const getItemPrice = (item: typeof items[0]) => {
    if (!item.product) return 0;
    const params = (item.selected_parameters as ParameterSelection) || {};
    return calculateProductPrice(item.product, params) * item.quantity;
  };

  const handleUpdateCartItem = async (
    itemId: number,
    newQuantity?: number,
    newParameters?: ParameterSelection
  ) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    setItemErrors(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    try {
      await updateCartItem(itemId, newQuantity, newParameters);
    } catch (error) {
      console.error('Error updating cart item:', error);
      setItemErrors(prev => ({
        ...prev,
        [itemId]: t('cart.failed-update')
      }));
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveFromCart = async (itemId: number) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    setItemErrors(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing from cart:', error);
      setItemErrors(prev => ({
        ...prev,
        [itemId]: t('cart.failed-remove')
      }));
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Compact/Sticky version for products page
  if (compact && sticky) {
    return (
      <div className={`
        fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] border-t z-50
        transition-all duration-300 ease-in-out
        ${isMinimized ? 'h-16' : 'h-[40vh]'}
      `}>
        {/* Header Bar */}
        <div
          onClick={() => setIsMinimized(!isMinimized)}
          className="
            flex items-center justify-between px-6 h-16 border-b bg-gradient-to-r from-primary/5 to-white
            cursor-pointer hover:bg-primary/5
            transition-colors
          "
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-primary" />
                {items.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary">
                    {items.length}
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {t('cart.shopping-cart')}
                </h3>
                {items.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {items.length} {items.length === 1 ? t('cart.item-count') : t('cart.items-count')}
                  </p>
                )}
              </div>
            </div>
            {items.length > 0 && (
              <div className="ml-4 px-4 py-1.5 bg-primary text-white rounded-full">
                <span className="text-lg font-bold">
                  ₮{total.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showCheckoutButton && items.length > 0 && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/checkout');
                }}
                size="lg"
                className="bg-secondary hover:bg-secondary/90"
              >
                {t('cart.checkout-button')}
              </Button>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              size="icon"
              variant="ghost"
              aria-label={isMinimized ? t('cart.expand') : t('cart.minimize')}
            >
              {isMinimized ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Cart Content */}
        {!isMinimized && (
          <div className="overflow-y-auto h-[calc(40vh-4rem)] bg-gray-50">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-3"></div>
                <p className="text-sm">{t('cart.loading')}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart className="h-16 w-16 mb-3 opacity-20" />
                <p className="text-sm">{t('cart.empty-message')}</p>
                <p className="text-xs mt-1">{t('cart.empty-add-products')}</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {/* Render Special Bundles */}
                {Object.entries(itemsBySpecial).map(([specialId, bundleItems]) => {
                  const isRemoving = removingSpecials.has(Number(specialId));
                  const bundlePrice = getBundlePrice(bundleItems);

                  return (
                    <div
                      key={`special-${specialId}`}
                      className={`
                        bg-gradient-to-br from-secondary/10 to-white rounded-lg p-4 shadow-sm border-2 border-secondary/30
                        ${isRemoving ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-secondary text-white">{t('cart.special-bundle')}</Badge>
                          <span className="text-xs text-muted-foreground">{t('cart.cannot-edit')}</span>
                        </div>
                        <Button
                          onClick={() => handleRemoveSpecial(Number(specialId))}
                          disabled={isRemoving}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 flex-shrink-0 hover:bg-red-50 hover:text-red-600"
                          title={t('cart.remove-bundle')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2 mb-3">
                        {bundleItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 text-sm">
                            <div className="relative w-20 h-20 rounded-md overflow-hidden bg-white flex-shrink-0">
                              <Image
                                src={item.product?.picture_url}
                                alt={item.product?.name || 'Product'}
                                className="object-cover w-full h-full"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1">
                                {item.product?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">{t('cart.qty')} {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm font-medium">{t('cart.bundle-total')}</span>
                        <span className="text-lg font-bold text-secondary">
                          ₮{bundlePrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Render Regular Items - Fully Editable */}
                {regularItems.length > 0 && (
                  <div>
                    {regularItems.map((item) => {
                      if (!item.product) return null;

                      const isUpdating = updatingItems.has(item.id);
                      const error = itemErrors[item.id];
                      const selections = (item.selected_parameters as ParameterSelection) || {};
                      const price = calculateProductPrice(item.product, selections);

                      return (
                        <ProductConfigRow
                          key={item.id}
                          product={item.product}
                          selectedParameters={selections}
                          quantity={item.quantity}
                          onParameterChange={(paramGroupId, paramId) => {
                            const newSelections = {
                              ...selections,
                              [paramGroupId]: paramId,
                            };
                            handleUpdateCartItem(item.id, undefined, newSelections);
                          }}
                          onQuantityChange={(newQuantity) =>
                            handleUpdateCartItem(item.id, newQuantity)
                          }
                          price={price}
                          disabled={isUpdating}
                          compact={true}
                          showBasePrice={false}
                          actions={
                            <div className="flex flex-col gap-1">
                              <Button
                                onClick={() => handleRemoveFromCart(item.id)}
                                disabled={isUpdating}
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                title={t('cart.remove-item')}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              {error && (
                                <p className="text-[10px] text-red-600 leading-tight">{error}</p>
                              )}
                            </div>
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Regular version for cart page
  if (items.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
          <p>{t('cart.empty-message')}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Special Bundles */}
      {Object.entries(itemsBySpecial).map(([specialId, bundleItems]) => {
        const isRemoving = removingSpecials.has(Number(specialId));
        const bundlePrice = getBundlePrice(bundleItems);

        return (
          <Card key={`special-${specialId}`} className="overflow-hidden border-2 border-secondary/30">
            <div className="bg-gradient-to-r from-secondary/10 to-white p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-secondary text-white">{t('cart.special-bundle')}</Badge>
                <span className="font-semibold">{t('cart.preconfigured-bundle')}</span>
              </div>
              <Button
                onClick={() => handleRemoveSpecial(Number(specialId))}
                disabled={isRemoving}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isRemoving ? t('cart.removing') : t('cart.remove-bundle')}
              </Button>
            </div>
            <div>
              {bundleItems.map((item) => {
                if (!item.product) return null;

                const selections = (item.selected_parameters as ParameterSelection) || {};
                const price = calculateProductPrice(item.product, selections);

                return (
                  <ProductConfigRow
                    key={item.id}
                    product={item.product}
                    selectedParameters={selections}
                    quantity={item.quantity}
                    price={price}
                    readOnly={true}
                    className="bg-secondary/5"
                  />
                );
              })}
              <div className="flex justify-between items-center p-4 bg-secondary/20 rounded-lg font-semibold mt-2">
                <span className="text-lg">{t('cart.bundle-total')}</span>
                <span className="text-xl font-bold text-secondary">
                  ₮{bundlePrice.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Regular Items */}
      {regularItems.length > 0 && (
        <div>
          {regularItems.map((item) => {
            if (!item.product) return null;

            const isUpdating = updatingItems.has(item.id);
            const error = itemErrors[item.id];
            const selections = (item.selected_parameters as ParameterSelection) || {};
            const price = item.product ? calculateProductPrice(item.product, selections) : 0;

            return (
              <ProductConfigRow
                key={item.id}
                product={item.product}
                selectedParameters={selections}
                quantity={item.quantity}
                onParameterChange={(paramGroupId, paramId) => {
                  const newSelections = {
                    ...selections,
                    [paramGroupId]: paramId,
                  };
                  handleUpdateCartItem(item.id, undefined, newSelections);
                }}
                onQuantityChange={(newQuantity) =>
                  handleUpdateCartItem(item.id, newQuantity)
                }
                price={price}
                disabled={isUpdating}
                actions={
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleRemoveFromCart(item.id)}
                      disabled={isUpdating}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isUpdating ? t('cart.removing') : t('cart.remove')}
                    </Button>
                    {error && (
                      <p className="text-xs text-destructive">{error}</p>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      {/* Total and Checkout */}
      <Card className="bg-gradient-to-r from-primary/5 to-white">
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('cart.cart-total')}</p>
            <div className="text-3xl font-bold">
              ₮{total.toLocaleString()}
            </div>
          </div>
          {showCheckoutButton && (
            <Button
              onClick={() => router.push('/checkout')}
              size="lg"
              className="bg-secondary hover:bg-secondary/90"
            >
              {t('cart.checkout')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
