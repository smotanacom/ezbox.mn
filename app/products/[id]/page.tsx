'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProduct } from '@/lib/queries';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { calculateProductPrice } from '@/lib/api-client';
import { getImageUrl } from '@/lib/storage-client';
import { useModelViewerSupport } from '@/hooks/useModelViewerSupport';
import { PageContainer, LoadingState } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from '@/components/Image';
import ModelViewer from '@/components/ModelViewer';
import Cart from '@/components/Cart';
import { ArrowLeft, ShoppingCart, Check, Minus, Plus, Box } from 'lucide-react';
import type { ParameterSelection, ProductImage, ProductModel } from '@/types/database';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = use(params);
  const productId = parseInt(id);
  const router = useRouter();
  const { t } = useTranslation();
  const { addToCart } = useCart();

  const { data, isLoading, error } = useProduct(productId);
  const isModelViewerSupported = useModelViewerSupport();

  const [selectedParameters, setSelectedParameters] = useState<ParameterSelection>({});
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [modelLoadFailed, setModelLoadFailed] = useState(false);

  const product = data?.product;
  // Images come from getProductImages which returns { data: ProductImage[], error: string | null }
  const imagesResponse = data?.images as { data?: ProductImage[]; error?: string | null } | undefined;
  const images = imagesResponse?.data || product?.images || [];
  // Model comes from getProductModel which returns { data: ProductModel | null, error: string | null }
  const modelResponse = data?.model as { data?: ProductModel | null; error?: string | null } | undefined;
  const model = modelResponse?.data || product?.model || null;

  // Determine if we can show the model
  const hasModel = !!(model && isModelViewerSupported && !modelLoadFailed);
  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);

  // Build media items array: model first (if available), then images
  type MediaItem = { type: 'model'; model: ProductModel } | { type: 'image'; image: ProductImage };
  const mediaItems: MediaItem[] = [];
  if (hasModel) {
    mediaItems.push({ type: 'model', model: model! });
  }
  sortedImages.forEach(img => {
    mediaItems.push({ type: 'image', image: img });
  });

  const handleModelError = () => {
    setModelLoadFailed(true);
    // If currently viewing the model, switch to first image
    if (selectedMediaIndex === 0) {
      setSelectedMediaIndex(0);
    }
  };

  // Initialize default parameters when product loads
  useEffect(() => {
    if (product?.parameter_groups) {
      const defaults: ParameterSelection = {};
      product.parameter_groups.forEach((pg) => {
        if (pg.default_parameter_id) {
          defaults[pg.parameter_group_id] = pg.default_parameter_id;
        }
      });
      setSelectedParameters(defaults);
    }
  }, [product]);

  const handleParameterChange = (paramGroupId: number, paramId: number) => {
    setSelectedParameters((prev) => ({
      ...prev,
      [paramGroupId]: paramId,
    }));
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAdding(true);
    setAddError(null);

    try {
      await addToCart(product.id, quantity, selectedParameters);
      setIsAdded(true);
      setQuantity(1);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setAddError(t('products.error-add-to-cart'));
    } finally {
      setIsAdding(false);
    }
  };

  const currentPrice = product ? calculateProductPrice(product, selectedParameters) : 0;
  const totalPrice = currentPrice * quantity;

  // Check if there are any non-zero price modifiers across selected parameters
  const hasNonZeroModifiers = product?.parameter_groups?.some((pg) => {
    const selectedParamId = selectedParameters[pg.parameter_group_id];
    const selectedParam = pg.parameters?.find(p => p.id === selectedParamId);
    return selectedParam && selectedParam.price_modifier !== 0;
  }) || false;

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !product) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('product.not-found')}
          </h1>
          <p className="text-gray-600 mb-8">
            {t('product.not-found-description')}
          </p>
          <Button onClick={() => router.push('/products')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('product.back-to-products')}
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer className="pb-[calc(40vh+2rem)]">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/products"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('product.back-to-products')}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery with 3D Model */}
          <div className="space-y-4">
            {/* Main View */}
            <Card className="relative overflow-hidden aspect-square bg-gray-100">
              {mediaItems.length === 0 ? (
                <Image
                  src={null}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : mediaItems[selectedMediaIndex]?.type === 'model' ? (
                <ModelViewer
                  model={mediaItems[selectedMediaIndex].model}
                  productName={product.name}
                  className="w-full h-full"
                  onError={handleModelError}
                />
              ) : mediaItems[selectedMediaIndex]?.type === 'image' ? (
                <Image
                  src={getImageUrl(mediaItems[selectedMediaIndex].image.medium_path)}
                  alt={mediaItems[selectedMediaIndex].image.alt_text || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={null}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </Card>

            {/* Thumbnails */}
            {mediaItems.length > 1 && (
              <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-2">
                {mediaItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMediaIndex(index)}
                    className={`relative flex-shrink-0 w-20 h-20 lg:w-28 lg:h-28 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedMediaIndex === index
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {item.type === 'model' ? (
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                        <Box className="w-8 h-8 lg:w-10 lg:h-10 text-blue-600" />
                        <span className="absolute bottom-1 left-1 right-1 text-[10px] lg:text-xs font-medium text-blue-700 bg-blue-100/80 rounded px-1 text-center">
                          3D
                        </span>
                      </div>
                    ) : (
                      <Image
                        src={getImageUrl(item.image.thumbnail_path || item.image.medium_path)}
                        alt={item.image.alt_text || `${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category badge */}
            {product.category && (
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                {product.category.name}
              </span>
            )}

            {/* Product name */}
            <h1 className="text-3xl font-bold text-gray-900">
              {product.name}
            </h1>

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Price display */}
            <div className="border-t border-b py-4 space-y-2">
              {hasNonZeroModifiers ? (
                <>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{t('product.base-price')}</span>
                    <span>₮{product.base_price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>{t('product.total-price')}</span>
                    <span className="text-primary">₮{currentPrice.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>{t('common.price')}</span>
                  <span className="text-primary">₮{currentPrice.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Parameter Groups */}
            {product.parameter_groups && product.parameter_groups.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  {t('product.configure-options')}
                </h3>

                {product.parameter_groups.map((pg) => (
                  <div key={pg.id} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {pg.parameter_group?.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {pg.parameters?.map((param) => {
                        const isSelected = selectedParameters[pg.parameter_group_id] === param.id;
                        return (
                          <button
                            key={param.id}
                            onClick={() => handleParameterChange(pg.parameter_group_id, param.id)}
                            className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/10 text-primary font-medium'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}
                          >
                            {param.name}
                            {param.price_modifier !== 0 && (
                              <span className={`ml-1 ${param.price_modifier > 0 ? 'text-gray-500' : 'text-green-600'}`}>
                                ({param.price_modifier > 0 ? '+' : ''}₮{param.price_modifier.toLocaleString()})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t('products.quantity')}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-semibold text-lg">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Total and Add to Cart */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('product.total')}</span>
                <span className="text-2xl font-bold text-gray-900">
                  ₮{totalPrice.toLocaleString()}
                </span>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={isAdding || isAdded}
                size="lg"
                className="w-full bg-secondary hover:bg-secondary/90"
              >
                {isAdded && <Check className="mr-2 h-5 w-5" />}
                {!isAdded && !isAdding && <ShoppingCart className="mr-2 h-5 w-5" />}
                {isAdding ? t('products.adding') : isAdded ? t('products.added') : t('products.add-to-cart')}
              </Button>

              {addError && (
                <p className="text-sm text-red-600 text-center">{addError}</p>
              )}
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Sticky Cart at Bottom */}
      <Cart compact sticky />
    </>
  );
}
