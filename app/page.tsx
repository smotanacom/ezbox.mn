'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import Image from '@/components/Image';
import ProductCarousel from '@/components/ProductCarousel';
import { PageContainer } from '@/components/layout';
import { SectionHeader } from '@/components/layout';
import { LoadingState } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package } from 'lucide-react';
import type { Category, Product, SpecialWithItems } from '@/types/database';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<number, Product[]>>({});
  const [specials, setSpecials] = useState<SpecialWithItems[]>([]);
  const [specialOriginalPrices, setSpecialOriginalPrices] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [addingSpecial, setAddingSpecial] = useState<Set<number>>(new Set());
  const [addedSpecial, setAddedSpecial] = useState<Set<number>>(new Set());
  const [specialErrors, setSpecialErrors] = useState<Record<number, string>>({});
  const { addSpecialToCart } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Use the batched API route
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const response = await fetch(`${baseUrl}/api/home`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch home data');
        }

        const data = await response.json();

        setCategories(data.categories);
        setSpecials(data.specials);

        // Use pre-calculated original prices from API
        setSpecialOriginalPrices(data.specialOriginalPrices || {});

        // Group products by category
        const grouped: Record<number, Product[]> = {};
        for (const product of data.products) {
          if (product.category_id) {
            if (!grouped[product.category_id]) {
              grouped[product.category_id] = [];
            }
            grouped[product.category_id].push(product);
          }
        }
        setProductsByCategory(grouped);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleAddSpecialToCart = async (specialId: number) => {
    setAddingSpecial(prev => new Set(prev).add(specialId));
    setSpecialErrors(prev => {
      const next = { ...prev };
      delete next[specialId];
      return next;
    });

    try {
      await addSpecialToCart(specialId);
      // Show checkmark
      setAddedSpecial(prev => new Set(prev).add(specialId));
      // Clear checkmark after 2 seconds
      setTimeout(() => {
        setAddedSpecial(prev => {
          const next = new Set(prev);
          next.delete(specialId);
          return next;
        });
      }, 2000);
    } catch (error) {
      console.error('Error adding special:', error);
      setSpecialErrors(prev => ({
        ...prev,
        [specialId]: 'Failed to add special'
      }));
    } finally {
      setAddingSpecial(prev => {
        const next = new Set(prev);
        next.delete(specialId);
        return next;
      });
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <>
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">EzBox.mn</h1>
          <p className="text-muted-foreground">Quality modular kitchens for your home</p>
        </div>
      </div>

      <PageContainer>
        {/* Specials Section */}
        {specials.length > 0 && (
          <section className="mb-12">
            <SectionHeader
              action={<Badge variant="secondary">Limited Time</Badge>}
            >
              Special Offers
            </SectionHeader>
            <div className="space-y-6">
              {specials.map((special) => {
                const isAdding = addingSpecial.has(special.id);
                const isAdded = addedSpecial.has(special.id);
                const error = specialErrors[special.id];
                const originalPrice = specialOriginalPrices[special.id] || 0;
                const savings = originalPrice - special.discounted_price;
                const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

                return (
                  <Card key={special.id} className={`overflow-hidden hover:shadow-lg transition-all ${isAdding ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col lg:flex-row">
                      {/* Left side: Image, Name, Description */}
                      <div className="lg:w-1/3 flex flex-col">
                        <div className="aspect-video lg:aspect-square relative overflow-hidden">
                          <Image
                            src={special.picture_url}
                            alt={special.name}
                            className="object-cover w-full h-full"
                          />
                          {savingsPercent > 0 && (
                            <Badge className="absolute top-2 right-2 bg-red-600 text-white text-lg px-3 py-1">
                              Save {savingsPercent}%
                            </Badge>
                          )}
                        </div>
                        <div className="p-6 flex-1">
                          <h3 className="text-2xl font-bold mb-2">{special.name}</h3>
                          {special.description && (
                            <p className="text-muted-foreground">{special.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Middle: Products List */}
                      <div className="lg:w-1/3 p-6 border-t lg:border-t-0 lg:border-l bg-gray-50">
                        <div className="flex items-center gap-2 mb-4">
                          <Package className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold text-lg">Included Products</h4>
                        </div>
                        <div className="space-y-3">
                          {special.items?.map((item: any, idx: number) => {
                            const product = item.product;
                            if (!product) return null;

                            return (
                              <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                                <div className="relative w-16 h-16 rounded-md overflow-hidden bg-white flex-shrink-0">
                                  <Image
                                    src={product.picture_url}
                                    alt={product.name}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm line-clamp-2">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {item.quantity}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right side: Pricing and CTA */}
                      <div className="lg:w-1/3 p-6 border-t lg:border-t-0 lg:border-l bg-gradient-to-br from-green-50 to-white flex flex-col justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Bundle Price</p>
                          {originalPrice > 0 && (
                            <div className="mb-4">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-lg text-muted-foreground line-through">
                                  ₮{originalPrice.toLocaleString()}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-red-600">
                                You Save ₮{savings.toLocaleString()}
                              </div>
                            </div>
                          )}
                          <div className="text-4xl font-bold text-green-600 mb-6">
                            ₮{special.discounted_price.toLocaleString()}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button
                            onClick={() => handleAddSpecialToCart(special.id)}
                            disabled={isAdding || isAdded}
                            size="lg"
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {isAdded && <span className="mr-2">✓</span>}
                            {!isAdded && !isAdding && <ShoppingCart className="mr-2 h-4 w-4" />}
                            {isAdding ? 'Adding...' : isAdded ? 'Added to Cart' : 'Add Bundle to Cart'}
                          </Button>
                          {error && (
                            <p className="text-sm text-destructive text-center">{error}</p>
                          )}
                          <p className="text-xs text-muted-foreground text-center">
                            Pre-configured bundle • No customization
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Products by Category */}
        <section className="space-y-12">
          {categories.map((category) => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  {category.name}
                </h3>
                <Link
                  href={`/products?category=${category.id}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="relative group">
                <div className="flex gap-6 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth pb-2"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {/* Category Card */}
                  <Link
                    href={`/products?category=${category.id}`}
                    className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px]"
                  >
                    <Card className="overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200 h-full border-2 border-primary/20 bg-primary/5">
                      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                        <Image
                          src={category.picture_url}
                          alt={category.name}
                          className="object-cover w-full h-full hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h4 className="text-sm font-bold line-clamp-2 mb-2 min-h-[2.5rem] text-primary">
                          View All
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          Browse {category.name}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Products */}
                  {(productsByCategory[category.id] || []).map((product) => (
                    <Link
                      key={product.id}
                      href={`/products?product=${product.id}`}
                      className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px]"
                    >
                      <Card className="overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200 h-full border-gray-200">
                        <div className="aspect-square relative overflow-hidden bg-gray-100">
                          <Image
                            src={product.picture_url}
                            alt={product.name}
                            className="object-cover w-full h-full hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h4 className="text-sm font-semibold line-clamp-2 mb-2 min-h-[2.5rem]">
                            {product.name}
                          </h4>
                          <span className="text-base font-bold text-primary">
                            ₮{product.base_price.toLocaleString()}
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>
      </PageContainer>
    </>
  );
}
