'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import Image from '@/components/Image';
import ImageCarousel from '@/components/ImageCarousel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import type { ProductWithDetails, ParameterSelection } from '@/types/database';

interface ProductConfigRowProps {
  product: ProductWithDetails;
  selectedParameters: ParameterSelection;
  quantity: number;
  onParameterChange?: (paramGroupId: number, paramId: number) => void;
  onQuantityChange?: (quantity: number) => void;
  price: number;
  totalPrice?: number; // if not provided, will calculate as price * quantity
  actions?: ReactNode;
  readOnly?: boolean;
  disabled?: boolean;
  showBasePrice?: boolean;
  compact?: boolean;
  className?: string;
}

export default function ProductConfigRow({
  product,
  selectedParameters,
  quantity,
  onParameterChange,
  onQuantityChange,
  price,
  totalPrice,
  actions,
  readOnly = false,
  disabled = false,
  showBasePrice = true,
  compact = false,
  className = '',
}: ProductConfigRowProps) {
  const { t } = useTranslation();
  const calculatedTotal = totalPrice ?? price * quantity;

  return (
    <div className={`p-3 mb-3 bg-white rounded-lg border shadow-sm ${disabled ? 'opacity-50' : ''} ${className}`}>
      <div className="flex gap-3 lg:gap-4">
        {/* Product Image */}
        <div className="relative flex-shrink-0 w-20 h-20 lg:w-32 lg:h-32 bg-gray-50 rounded-md overflow-hidden border">
          <ImageCarousel
            images={product.images || []}
            productName={product.name}
            model={product.model}
            className="rounded-md"
            showControls={false}
          />
        </div>

        {/* Product Info & Configuration */}
        <div className="flex-1 min-w-0">
          {/* Product Name & Description */}
          <div className="mb-2">
            <Link
              href={`/products/${product.id}`}
              className="inline-block"
            >
              <h3 className="font-semibold text-base lg:text-lg leading-tight hover:text-primary transition-colors">
                {product.name}
              </h3>
            </Link>
            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          {/* Parameter Configuration - Compact */}
          <div className="space-y-2 mb-3">
            {product.parameter_groups?.map((pg) => {
              const selectedParamId = selectedParameters[pg.parameter_group_id];
              const selectedParam = pg.parameters?.find(p => p.id === selectedParamId);

              return (
                <div key={pg.parameter_group_id}>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {pg.parameter_group?.name}
                  </Label>
                  {readOnly ? (
                    <div className="text-xs font-medium">
                      {selectedParam?.name || 'N/A'}
                      {selectedParam?.price_modifier !== 0 &&
                        ` (+₮${selectedParam!.price_modifier.toLocaleString()})`}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {pg.parameters?.map((param) => {
                        const isSelected = param.id === selectedParamId;
                        return (
                          <button
                            key={param.id}
                            onClick={() => onParameterChange?.(pg.parameter_group_id, param.id)}
                            disabled={disabled}
                            className={`
                              px-2 py-1 text-xs rounded border transition-colors
                              ${isSelected
                                ? 'bg-primary text-primary-foreground border-primary font-medium'
                                : 'bg-background hover:bg-muted border-border'
                              }
                              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            {param.name}
                            {param.price_modifier !== 0 && (
                              <span className="ml-1 opacity-75">
                                {param.price_modifier > 0 ? '+' : ''}₮{Math.abs(param.price_modifier).toLocaleString()}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Row: Quantity, Price, and Actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Quantity */}
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground mr-1">
                {t('products.quantity')}:
              </Label>
              {readOnly ? (
                <span className="text-sm font-medium">x{quantity}</span>
              ) : (
                <div className="flex items-center border rounded">
                  <button
                    onClick={() => onQuantityChange?.(Math.max(1, quantity - 1))}
                    disabled={disabled || quantity <= 1}
                    className="p-1 hover:bg-muted disabled:opacity-50"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) => onQuantityChange?.(parseInt(e.target.value) || 1)}
                    disabled={disabled}
                    className="w-10 text-center text-sm border-0 focus:ring-0 py-0.5 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => onQuantityChange?.(quantity + 1)}
                    disabled={disabled}
                    className="p-1 hover:bg-muted disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                {price !== product.base_price && (
                  <div className="text-xs text-muted-foreground">
                    ₮{price.toLocaleString()} × {quantity}
                  </div>
                )}
                <div className="text-base font-bold">
                  ₮{calculatedTotal.toLocaleString()}
                </div>
              </div>

              {/* Actions */}
              {actions && (
                <div className="flex items-center">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
