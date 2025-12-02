'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useHomeData } from '@/lib/queries';
import Image from '@/components/Image';
import KitchenTetris from '@/components/KitchenTetris';
import CategoryProductGrid from '@/components/CategoryProductGrid';
import SpecialOffersCarousel from '@/components/SpecialOffersCarousel';
import { LoadingState } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();

  // Use React Query hook to fetch home page data
  const { data: homeData, isLoading: loading } = useHomeData();
  const categories = homeData?.categories || [];
  const productsByCategory = homeData?.productsByCategory || {};
  const specials = homeData?.specials || [];
  const specialOriginalPrices = homeData?.specialOriginalPrices || {};

  // UI State
  const [addingSpecial, setAddingSpecial] = useState<Set<number>>(new Set());
  const [addedSpecial, setAddedSpecial] = useState<Set<number>>(new Set());
  const [specialErrors, setSpecialErrors] = useState<Record<number, string>>({});
  const { addSpecialToCart } = useCart();

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
      {/* Hero + Specials Container */}
      <div className="flex flex-col lg:flex-row border-b">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary/5 via-white to-secondary/5 overflow-hidden min-h-[600px] flex-1">
          {/* Animated Background */}
          <KitchenTetris />

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-32 sm:px-8 lg:px-12 sm:py-40 lg:py-48">
            <div className="text-center space-y-6 max-w-4xl mx-auto">
              {/* Logo/Brand */}
              <div className="inline-block">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-2 flex items-center justify-center gap-4">
                  <Package className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-primary" />
                  <span>EzBox<span className="text-primary">.mn</span></span>
                </h1>
              </div>

              {/*/!* Main Tagline *!/*/}
              {/*<h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 drop-shadow-sm">*/}
              {/*  Transform Your Kitchen with Premium Modular Solutions*/}
              {/*</h2>*/}

              {/*/!* Subtitle *!/*/}
              {/*<p className="text-lg sm:text-xl text-gray-600 leading-relaxed drop-shadow-sm">*/}
              {/*  Customizable, high-quality kitchen modules designed for modern Mongolian homes.*/}
              {/*  Build your dream kitchen with ease and precision.*/}
              {/*</p>*/}

              {/*/!* Feature Pills *!/*/}
              {/*<div className="flex flex-wrap justify-center gap-3 pt-4">*/}
              {/*  <Badge variant="secondary" className="px-4 py-2 text-sm bg-white/80 backdrop-blur-sm">*/}
              {/*    🎨 Fully Customizable*/}
              {/*  </Badge>*/}
              {/*  <Badge variant="secondary" className="px-4 py-2 text-sm bg-white/80 backdrop-blur-sm">*/}
              {/*    ✨ Premium Quality*/}
              {/*  </Badge>*/}
              {/*  <Badge variant="secondary" className="px-4 py-2 text-sm bg-white/80 backdrop-blur-sm">*/}
              {/*    📦 Modular Design*/}
              {/*  </Badge>*/}
              {/*  <Badge variant="secondary" className="px-4 py-2 text-sm bg-white/80 backdrop-blur-sm">*/}
              {/*    🚚 Easy Installation*/}
              {/*  </Badge>*/}
              {/*</div>*/}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button asChild size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg transition-all">
                  <Link href="/products">
                    {t('home.browse-products')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Specials Section */}
        <div className="flex-1">
          <SpecialOffersCarousel
            specials={specials}
            specialOriginalPrices={specialOriginalPrices}
            onAddToCart={handleAddSpecialToCart}
            addingSpecial={addingSpecial}
            addedSpecial={addedSpecial}
            specialErrors={specialErrors}
          />
        </div>
      </div>

      {/* Products by Category - Grid View */}
      <CategoryProductGrid
        categories={categories}
        productsByCategory={productsByCategory}
      />

      {/* Custom Design Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Image */}
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800&q=80"
                alt="Custom Kitchen Design"
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div>
                <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                  {t('home.custom.badge')}
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  {t('home.custom.title')}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {t('home.custom.description')}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">{t('home.custom.feature1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">{t('home.custom.feature2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <p className="text-gray-700">{t('home.custom.feature3')}</p>
                </div>
              </div>

              <div className="pt-4">
                <Button asChild size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                  <Link href="/custom">
                    {t('home.custom.cta')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
