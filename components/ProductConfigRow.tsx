'use client';

import { ReactNode } from 'react';
import Image from '@/components/Image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const calculatedTotal = totalPrice ?? price * quantity;

  return (
    <div className={`flex gap-4 p-4 mb-4 bg-muted/50 rounded-lg ${disabled ? 'opacity-50' : ''} ${className}`}>
      {/* Product Image & Name */}
      <div className="relative flex-shrink-0 w-40 h-40 bg-white rounded-md overflow-hidden border">
        <Image
          src={product.picture_url}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <div className={`${compact ? 'text-xs' : 'text-sm'} font-medium drop-shadow-lg`}>
            {product.name}
          </div>
          {showBasePrice && (
            <div className="text-xs text-white/90 drop-shadow-lg">
              Base: ₮{product.base_price.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Configuration Section */}
      <div className="flex-1 flex flex-col justify-between gap-4">
        {/* Parameter Configuration */}
        <div className="flex flex-wrap gap-4">
          {product.parameter_groups?.map((pg) => {
            const selectedParamId = selectedParameters[pg.parameter_group_id];
            const selectedParam = pg.parameters?.find(p => p.id === selectedParamId);

            return (
              <div key={pg.parameter_group_id} className="flex flex-col gap-2">
                <Label className="text-xs font-medium">
                  {pg.parameter_group?.name}
                </Label>
                {readOnly ? (
                  <div className="px-3 py-2 bg-background rounded-md text-sm border">
                    {selectedParam?.name || 'N/A'}
                    {selectedParam?.price_modifier !== 0 &&
                      ` (${selectedParam!.price_modifier > 0 ? '+' : ''}₮${selectedParam!.price_modifier.toLocaleString()})`}
                  </div>
                ) : (
                  <Select
                    value={String(selectedParamId || '')}
                    onValueChange={(value) =>
                      onParameterChange?.(pg.parameter_group_id, parseInt(value))
                    }
                    disabled={disabled}
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
                )}
              </div>
            );
          })}

          {/* Quantity */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium">Quantity</Label>
            {readOnly ? (
              <div className="px-3 py-2 bg-background rounded-md text-sm border font-medium">
                x{quantity}
              </div>
            ) : (
              <Input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => onQuantityChange?.(parseInt(e.target.value) || 1)}
                disabled={disabled}
                className="w-24"
              />
            )}
          </div>
        </div>

        {/* Bottom Row: Price and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {!compact && price !== product.base_price && (
              <div className="text-xs text-muted-foreground">
                ₮{price.toLocaleString()} each
              </div>
            )}
            <div className={`${compact ? 'text-base' : 'text-xl'} font-bold`}>
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
  );
}
