'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getAllProductsWithDetails,
  calculateProductPrice,
} from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import Image from '@/components/Image';
import Cart from '@/components/Cart';
import { PageContainer, PageTitle, SectionHeader, LoadingState } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      {/* Categories Section */}
      <section className="mb-12">
        <SectionHeader>Categories</SectionHeader>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-6">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      const categoryProducts = products.filter((p) => p.category_id === cat.id);
                      initializeProductConfigs(categoryProducts);
                      router.push(`/products?category=${cat.id}`);
                    }}
                    className="flex flex-col items-center group cursor-pointer transition-all"
                  >
                    <div className={`relative w-32 h-32 rounded-lg overflow-hidden ring-2 transition-all mb-2 ${
                      selectedCategoryId === cat.id
                        ? 'ring-primary scale-105'
                        : 'ring-gray-200 group-hover:ring-primary group-hover:scale-[1.02]'
                    }`}>
                      <Image
                        src={cat.picture_url}
                        alt={cat.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <span className={`text-sm font-medium transition-colors ${
                      selectedCategoryId === cat.id
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-primary'
                    }`}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

      {/* Product Configuration Section */}
      <section>
        <SectionHeader>Configure Products</SectionHeader>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Product</TableHead>
                    <TableHead>Configuration</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-32">Price</TableHead>
                    <TableHead className="w-32">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, productIndex) => {
                    const config = productConfigs[product.id] || { parameters: {}, quantity: 1 };
                    const price = getProductPrice(product);
                    const totalPrice = price * config.quantity;

                    const isAdding = addingToCart.has(product.id);
                    const isAdded = addedToCart.has(product.id);
                    const error = cartErrors[product.id];

                    return (
                      <TableRow key={product.id} className={isAdding ? 'opacity-50' : ''}>
                        {/* Product Name & Base Price */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                              <Image
                                src={product.picture_url}
                                alt={product.name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div>
                              <div className="font-medium">
                                {product.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Base: ₮{product.base_price.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Parameter Configuration */}
                        <TableCell>
                          <div className="flex flex-wrap gap-4">
                            {product.parameter_groups?.map((pg) => (
                              <div key={pg.parameter_group_id} className="flex flex-col gap-2">
                                <Label className="text-xs">
                                  {pg.parameter_group?.name}
                                </Label>
                                <Select
                                  value={String(config.parameters[pg.parameter_group_id] || '')}
                                  onValueChange={(value) =>
                                    handleParameterChange(
                                      product.id,
                                      pg.parameter_group_id,
                                      parseInt(value)
                                    )
                                  }
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
                            ))}
                          </div>
                        </TableCell>

                        {/* Quantity */}
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={config.quantity}
                            onChange={(e) =>
                              handleQuantityChange(product.id, parseInt(e.target.value) || 1)
                            }
                            className="w-20"
                          />
                        </TableCell>

                        {/* Price */}
                        <TableCell>
                          <div className="text-lg font-semibold">
                            ₮{totalPrice.toLocaleString()}
                          </div>
                        </TableCell>

                        {/* Add to Cart */}
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleAddToCart(product.id)}
                              disabled={isAdding || isAdded}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isAdded && <Check className="mr-2 h-4 w-4" />}
                              {!isAdded && !isAdding && <ShoppingCart className="mr-2 h-4 w-4" />}
                              {isAdding ? 'Adding...' : isAdded ? 'Added' : 'Add'}
                            </Button>
                            {error && (
                              <p className="text-xs text-destructive">{error}</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-32">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        {selectedCategoryId
                          ? 'No products found in this category'
                          : 'Select a category to view products'}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                </TableBody>
              </Table>
            </div>
          </Card>
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
