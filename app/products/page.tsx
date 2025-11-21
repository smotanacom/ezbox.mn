'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getAllProductsWithDetails,
  calculateProductPrice,
} from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import ProductCard from '@/components/ProductCard';
import ProductConfigRow from '@/components/ProductConfigRow';
import Cart from '@/components/Cart';
import HorizontalScroller from '@/components/HorizontalScroller';
import { PageContainer, PageTitle, SectionHeader, LoadingState } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';
import type {
  Category,
  ProductWithDetails,
  ParameterSelection,
} from '@/types/database';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items, total, addToCart, updateCartItem, removeFromCart, loading: cartLoading } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<Set<number>>(new Set());
  const [cartErrors, setCartErrors] = useState<Record<number, string>>({});
  const [addedToCart, setAddedToCart] = useState<Set<number>>(new Set());

  // UI State
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  // Store parameters and quantities per product
  const [productConfigs, setProductConfigs] = useState<Record<number, {
    parameters: ParameterSelection;
    quantity: number;
  }>>({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const prods = await getAllProductsWithDetails();

        // Extract unique categories from products
        const categoryMap = new Map<number, Category>();
        prods.forEach((prod) => {
          if (prod.category) {
            categoryMap.set(prod.category.id, prod.category);
          }
        });
        const cats = Array.from(categoryMap.values()).sort((a, b) => a.id - b.id);

        setCategories(cats);
        setProducts(prods);

        // Set initial selections from URL params
        const categoryParam = searchParams.get('category');
        const productParam = searchParams.get('product');

        if (categoryParam) {
          const catId = parseInt(categoryParam);
          setSelectedCategoryId(catId);
          const categoryProducts = prods.filter((p) => p.category_id === catId);
          initializeProductConfigs(categoryProducts);
        }

        if (productParam) {
          const prodId = parseInt(productParam);
          const product = prods.find((p) => p.id === prodId);
          if (product) {
            setSelectedCategoryId(product.category_id);
            const categoryProducts = prods.filter((p) => p.category_id === product.category_id);
            initializeProductConfigs(categoryProducts);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const initializeProductConfigs = (products: ProductWithDetails[]) => {
    const configs: Record<number, { parameters: ParameterSelection; quantity: number }> = {};
    products.forEach((product) => {
      const defaults: ParameterSelection = {};
      product.parameter_groups?.forEach((pg) => {
        if (pg.default_parameter_id) {
          defaults[pg.parameter_group_id] = pg.default_parameter_id;
        }
      });
      configs[product.id] = {
        parameters: defaults,
        quantity: 1,
      };
    });
    setProductConfigs(configs);
  };

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return products.filter((p) => p.category_id === selectedCategoryId);
  }, [products, selectedCategoryId]);

  const handleParameterChange = (productId: number, paramGroupId: number, paramId: number) => {
    setProductConfigs((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        parameters: {
          ...prev[productId]?.parameters,
          [paramGroupId]: paramId,
        },
      },
    }));
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    setProductConfigs((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: newQuantity,
      },
    }));
  };

  const handleAddToCart = async (productId: number) => {
    const config = productConfigs[productId];
    if (!config) return;

    setAddingToCart(prev => new Set(prev).add(productId));
    setCartErrors(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });

    try {
      await addToCart(productId, config.quantity, config.parameters);
      // Reset quantity to 1 after adding
      setProductConfigs((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          quantity: 1,
        },
      }));
      // Show checkmark
      setAddedToCart(prev => new Set(prev).add(productId));
      // Clear checkmark after 2 seconds
      setTimeout(() => {
        setAddedToCart(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }, 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setCartErrors(prev => ({
        ...prev,
        [productId]: 'Failed to add to cart'
      }));
    } finally {
      setAddingToCart(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const getProductPrice = (product: ProductWithDetails) => {
    const config = productConfigs[product.id];
    if (!config) return product.base_price;
    return calculateProductPrice(product, config.parameters);
  };


  if (loading) {
    return <LoadingState />;
  }

  return (
    <>
      <PageContainer className="pb-[calc(40vh+2rem)]">
      {/* Categories Section - Netflix Style Scroller */}
      <section className="mb-12 -mx-4 sm:-mx-6 lg:-mx-12">
        <SectionHeader className="px-4 sm:px-6 lg:px-12">Categories</SectionHeader>
          <HorizontalScroller>
            {categories.map((cat) => (
              <div key={cat.id} className="flex-shrink-0 w-[45vw] sm:w-[30vw] md:w-[23vw] lg:w-[18vw] xl:w-[15vw]">
                <ProductCard
                  imageUrl={cat.picture_url}
                  title={cat.name}
                  selected={selectedCategoryId === cat.id}
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    const categoryProducts = products.filter((p) => p.category_id === cat.id);
                    initializeProductConfigs(categoryProducts);
                    router.push(`/products?category=${cat.id}`);
                  }}
                />
              </div>
            ))}
          </HorizontalScroller>
        </section>

      {/* Product Configuration Section */}
      <section>
        {filteredProducts.length > 0 ? (
          <div>
            {filteredProducts.map((product, productIndex) => {
              const config = productConfigs[product.id] || { parameters: {}, quantity: 1 };
              const price = getProductPrice(product);
              const totalPrice = price * config.quantity;

              const isAdding = addingToCart.has(product.id);
              const isAdded = addedToCart.has(product.id);
              const error = cartErrors[product.id];

              return (
                <ProductConfigRow
                  key={product.id}
                  product={product}
                  selectedParameters={config.parameters}
                  quantity={config.quantity}
                  onParameterChange={(paramGroupId, paramId) =>
                    handleParameterChange(product.id, paramGroupId, paramId)
                  }
                  onQuantityChange={(newQuantity) =>
                    handleQuantityChange(product.id, newQuantity)
                  }
                  price={price}
                  totalPrice={totalPrice}
                  disabled={isAdding}
                  actions={
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={isAdding || isAdded}
                        size="sm"
                        className="bg-secondary hover:bg-secondary/90"
                      >
                        {isAdded && <Check className="mr-2 h-4 w-4" />}
                        {!isAdded && !isAdding && <ShoppingCart className="mr-2 h-4 w-4" />}
                        {isAdding ? 'Adding...' : isAdded ? 'Added' : 'Add'}
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
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground py-12">
            {selectedCategoryId
              ? 'No products found in this category'
              : 'Select a category to view products'}
          </div>
        )}
      </section>
      </PageContainer>

      {/* Sticky Cart at Bottom */}
      <Cart compact sticky />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProductsContent />
    </Suspense>
  );
}
