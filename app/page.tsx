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
import { ShoppingCart } from 'lucide-react';
import type { Category, Product, SpecialWithItems } from '@/types/database';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<number, Product[]>>({});
  const [specials, setSpecials] = useState<SpecialWithItems[]>([]);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specials.map((special) => {
                const isAdding = addingSpecial.has(special.id);
                const isAdded = addedSpecial.has(special.id);
                const error = specialErrors[special.id];

                return (
                  <Card key={special.id} className={`overflow-hidden hover:shadow-lg transition-all ${isAdding ? 'opacity-50' : ''}`}>
                    <div className="aspect-video relative overflow-hidden">
                      <Image
                        src={special.picture_url}
                        alt={special.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">{special.name}</CardTitle>
                      {special.description && (
                        <CardDescription>{special.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-0">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-3xl font-bold text-green-600">
                          ₮{special.discounted_price.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleAddSpecialToCart(special.id)}
                        disabled={isAdding || isAdded}
                        size="lg"
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isAdded && <span className="mr-2">✓</span>}
                        {!isAdded && !isAdding && <ShoppingCart className="mr-2 h-4 w-4" />}
                        {isAdding ? 'Adding...' : isAdded ? 'Added' : 'Add to Cart'}
                      </Button>
                      {error && (
                        <p className="text-sm text-destructive text-center">{error}</p>
                      )}
                    </CardFooter>
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
