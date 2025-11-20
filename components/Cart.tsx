'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { calculateProductPrice } from '@/lib/api';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ShoppingCart, Trash2 } from 'lucide-react';
import type { ParameterSelection } from '@/types/database';

interface CartProps {
  showCheckoutButton?: boolean;
  compact?: boolean;
  sticky?: boolean;
}

export default function Cart({ showCheckoutButton = true, compact = false, sticky = false }: CartProps) {
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
        [itemId]: 'Failed to update item'
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
        [itemId]: 'Failed to remove item'
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
            flex items-center justify-between px-6 h-16 border-b bg-gradient-to-r from-blue-50 to-white
            cursor-pointer hover:bg-blue-50
            transition-colors
          "
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
                {items.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-600">
                    {items.length}
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Shopping Cart
                </h3>
                {items.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </p>
                )}
              </div>
            </div>
            {items.length > 0 && (
              <div className="ml-4 px-4 py-1.5 bg-blue-600 text-white rounded-full">
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
                className="bg-green-600 hover:bg-green-700"
              >
                Checkout
              </Button>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              size="icon"
              variant="ghost"
              aria-label={isMinimized ? 'Expand cart' : 'Minimize cart'}
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
                <p className="text-sm">Loading cart...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart className="h-16 w-16 mb-3 opacity-20" />
                <p className="text-sm">Your cart is empty</p>
                <p className="text-xs mt-1">Add some products to get started</p>
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
                        bg-gradient-to-br from-green-50 to-white rounded-lg p-4 shadow-sm border-2 border-green-200
                        ${isRemoving ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-600 text-white">Special Bundle</Badge>
                          <span className="text-xs text-muted-foreground">Cannot be edited</span>
                        </div>
                        <Button
                          onClick={() => handleRemoveSpecial(Number(specialId))}
                          disabled={isRemoving}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 flex-shrink-0 hover:bg-red-50 hover:text-red-600"
                          title="Remove bundle"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2 mb-3">
                        {bundleItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            <div className="relative w-12 h-12 rounded overflow-hidden bg-white flex-shrink-0">
                              <Image
                                src={item.product?.picture_url}
                                alt={item.product?.name || 'Product'}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs line-clamp-1">
                                {item.product?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm font-medium">Bundle Total:</span>
                        <span className="text-lg font-bold text-green-600">
                          ₮{bundlePrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Render Regular Items */}
                {regularItems.map((item) => {
                  const isUpdating = updatingItems.has(item.id);
                  const error = itemErrors[item.id];
                  const selections = (item.selected_parameters as ParameterSelection) || {};

                  return (
                    <div
                      key={item.id}
                      className={`
                        bg-white rounded-lg p-4 shadow-sm border
                        hover:shadow-md transition-all
                        ${isUpdating ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={item.product?.picture_url}
                              alt={item.product?.name || 'Product'}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {item.product?.name}
                              </h4>
                              {/* Show selected parameters */}
                              <div className="flex flex-wrap gap-1">
                                {item.product?.parameter_groups?.map((pg) => {
                                  const selectedParamId = selections[pg.parameter_group_id];
                                  const selectedParam = pg.parameters?.find(p => p.id === selectedParamId);
                                  if (!selectedParam) return null;
                                  return (
                                    <Badge key={pg.parameter_group_id} variant="outline" className="text-xs">
                                      {selectedParam.name}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleRemoveFromCart(item.id)}
                              disabled={isUpdating}
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 flex-shrink-0 hover:bg-red-50 hover:text-red-600"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Quantity & Price */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-gray-600">Qty:</Label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateCartItem(item.id, parseInt(e.target.value) || 1)
                                }
                                disabled={isUpdating}
                                className="h-8 w-16 text-sm"
                              />
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              ₮{getItemPrice(item).toLocaleString()}
                            </div>
                          </div>

                          {error && (
                            <p className="text-xs text-red-600 mt-2">{error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* View Full Cart Link */}
                <div className="pt-2 text-center">
                  <Button
                    onClick={() => router.push('/cart')}
                    variant="link"
                    className="text-sm text-blue-600"
                  >
                    View full cart to edit details →
                  </Button>
                </div>
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
          <p>Your cart is empty</p>
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
          <Card key={`special-${specialId}`} className="overflow-hidden border-2 border-green-200">
            <div className="bg-gradient-to-r from-green-50 to-white p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600 text-white">Special Bundle</Badge>
                <span className="font-semibold">Pre-configured bundle (Cannot be edited)</span>
              </div>
              <Button
                onClick={() => handleRemoveSpecial(Number(specialId))}
                disabled={isRemoving}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isRemoving ? 'Removing...' : 'Remove Bundle'}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Configuration</TableHead>
                    <TableHead className="w-24">Quantity</TableHead>
                    <TableHead className="w-32">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundleItems.map((item) => {
                    const selections = (item.selected_parameters as ParameterSelection) || {};
                    return (
                      <TableRow key={item.id} className="bg-green-50/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-16 rounded-md overflow-hidden">
                              <Image
                                src={item.product?.picture_url}
                                alt={item.product?.name || 'Product'}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div>
                              <div className="font-medium">
                                {item.product?.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Base: ₮{item.product?.base_price.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {item.product?.parameter_groups?.map((pg) => {
                              const selectedParamId = selections[pg.parameter_group_id];
                              const selectedParam = pg.parameters?.find(p => p.id === selectedParamId);
                              if (!selectedParam) return null;
                              return (
                                <Badge key={pg.parameter_group_id} variant="outline">
                                  {pg.parameter_group?.name}: {selectedParam.name}
                                </Badge>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.quantity}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            ₮{getItemPrice(item).toLocaleString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-green-100 font-semibold">
                    <TableCell colSpan={3} className="text-right">
                      Bundle Total:
                    </TableCell>
                    <TableCell>
                      <div className="text-lg font-bold text-green-600">
                        ₮{bundlePrice.toLocaleString()}
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        );
      })}

      {/* Regular Items */}
      {regularItems.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Configuration</TableHead>
                  <TableHead className="w-24">Quantity</TableHead>
                  <TableHead className="w-32">Price</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
          {regularItems.map((item) => {
            const isUpdating = updatingItems.has(item.id);
            const error = itemErrors[item.id];
            return (
              <TableRow key={item.id} className={isUpdating ? 'opacity-50' : ''}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden">
                      <Image
                        src={item.product?.picture_url}
                        alt={item.product?.name || 'Product'}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <div className="font-medium">
                        {item.product?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Base: ₮{item.product?.base_price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-4">
                    {item.product?.parameter_groups?.map((pg) => {
                      const selections = (item.selected_parameters as ParameterSelection) || {};
                      const selectedParamId = selections[pg.parameter_group_id];

                      return (
                        <div key={pg.parameter_group_id} className="flex flex-col gap-2">
                          <Label className="text-xs">
                            {pg.parameter_group?.name}
                          </Label>
                          <Select
                            value={String(selectedParamId || '')}
                            onValueChange={(value) => {
                              const newParamId = parseInt(value);
                              const newSelections = {
                                ...selections,
                                [pg.parameter_group_id]: newParamId,
                              };
                              handleUpdateCartItem(item.id, undefined, newSelections);
                            }}
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {pg.parameters?.map((param) => (
                                <SelectItem key={param.id} value={String(param.id)}>
                                  {param.name}
                                  {param.price_modifier !== 0 &&
                                    ` (${param.price_modifier > 0 ? '+' : ''}₮${param.price_modifier.toLocaleString()})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={item.quantity}
                    onChange={(e) =>
                      handleUpdateCartItem(item.id, parseInt(e.target.value) || 1)
                    }
                    disabled={isUpdating}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <div className="font-semibold">
                    ₮{getItemPrice(item).toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleRemoveFromCart(item.id)}
                      disabled={isUpdating}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isUpdating ? 'Removing...' : 'Remove'}
                    </Button>
                    {error && (
                      <p className="text-xs text-destructive">{error}</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Total and Checkout */}
      <Card className="bg-gradient-to-r from-blue-50 to-white">
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Cart Total</p>
            <div className="text-3xl font-bold">
              ₮{total.toLocaleString()}
            </div>
          </div>
          {showCheckoutButton && (
            <Button
              onClick={() => router.push('/checkout')}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              Proceed to Checkout
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
