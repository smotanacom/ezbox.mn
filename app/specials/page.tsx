'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from '@/contexts/LanguageContext';
import Image from '@/components/Image';
import Cart from '@/components/Cart';
import { LoadingState } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, PackageOpen } from 'lucide-react';
import type { SpecialWithItems } from '@/types/database';

export default function SpecialsPage() {
  const { t } = useTranslation();
  const [specials, setSpecials] = useState<SpecialWithItems[]>([]);
  const [specialOriginalPrices, setSpecialOriginalPrices] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [addingSpecial, setAddingSpecial] = useState<Set<number>>(new Set());
  const [addedSpecial, setAddedSpecial] = useState<Set<number>>(new Set());
  const [specialErrors, setSpecialErrors] = useState<Record<number, string>>({});
  const { addSpecialToCart } = useCart();

  useEffect(() => {
    async function loadSpecials() {
      try {
        setLoading(true);
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const response = await fetch(`${baseUrl}/api/specials`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch specials');
        }

        const data = await response.json();
        setSpecials(data.specials);
        setSpecialOriginalPrices(data.specialOriginalPrices || {});
      } catch (error) {
        console.error('Error loading specials:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSpecials();
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
      <div className="min-h-screen bg-gray-50 pb-[calc(40vh+2rem)]">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-white to-secondary/10 border-b">
          <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center space-y-4">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                {t('home.specials.title')}
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
                {t('specials.title')}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t('specials.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Specials Grid */}
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {specials.length === 0 ? (
            <div className="text-center py-16">
              <PackageOpen className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {t('specials.no-specials')}
              </h2>
              <p className="text-gray-600 mb-8">
                {t('specials.no-specials-description')}
              </p>
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/products">
                  {t('specials.browse-products')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {specials.map((special) => {
                const originalPrice = specialOriginalPrices[special.id] || 0;
                const savings = originalPrice - special.discounted_price;
                const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
                const isAdding = addingSpecial.has(special.id);
                const isAdded = addedSpecial.has(special.id);
                const error = specialErrors[special.id];

                return (
                  <div
                    key={special.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-64 overflow-hidden">
                      <Image
                        src={special.picture_url}
                        alt={special.name}
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                      />
                      {savingsPercent > 0 && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-primary text-white px-4 py-2 text-lg font-bold shadow-lg">
                            Save {savingsPercent}%
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {special.name}
                      </h3>

                      {special.description && (
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {special.description}
                        </p>
                      )}

                      {/* Includes */}
                      {special.items && special.items.length > 0 && (
                        <div className="mb-4 text-sm text-gray-500">
                          <p className="font-semibold mb-1">{t('specials.includes')}:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {special.items.slice(0, 3).map((item, idx) => (
                              <li key={idx} className="truncate">
                                {item.quantity}x {item.product?.name || 'Product'}
                              </li>
                            ))}
                            {special.items.length > 3 && (
                              <li className="text-primary font-medium">
                                +{special.items.length - 3} more items
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Spacer */}
                      <div className="flex-1"></div>

                      {/* Pricing */}
                      <div className="mb-4">
                        {originalPrice > 0 && (
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-lg text-gray-400 line-through">
                              ₮{originalPrice.toLocaleString()}
                            </span>
                            <span className="text-sm font-semibold text-green-600">
                              {t('specials.you-save')} ₮{savings.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="text-3xl font-bold text-gray-900">
                          ₮{special.discounted_price.toLocaleString()}
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Button
                        onClick={() => handleAddSpecialToCart(special.id)}
                        disabled={isAdding || isAdded}
                        size="lg"
                        className="w-full bg-secondary hover:bg-secondary/90 text-white"
                      >
                        {isAdded && <span className="mr-2">✓</span>}
                        {!isAdded && !isAdding && <ShoppingCart className="mr-2 h-5 w-5" />}
                        {isAdding ? t('specials.adding') : isAdded ? t('specials.added') : t('specials.add-to-cart')}
                      </Button>
                      {error && (
                        <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Cart at Bottom */}
      <Cart compact sticky />
    </>
  );
}
