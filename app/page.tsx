import { Suspense } from 'react';
import { getCategories, getAllProductsWithDetails, getSpecials, calculateSpecialOriginalPricesBatch, getCustomDesignCoverImage } from '@/lib/api';
import { HomeContent } from '@/components/HomeContent';
import { HomePageSkeleton } from '@/components/HomePageSkeleton';

// Revalidate every 5 minutes
export const revalidate = 300;

async function getHomeData() {
  // Fetch all home page data in parallel
  const [categories, products, specials, customDesignCoverImage] = await Promise.all([
    getCategories(),
    getAllProductsWithDetails(),
    getSpecials('available'),
    getCustomDesignCoverImage(),
  ]);

  // Group products by category
  const productsByCategory: Record<number, typeof products> = {};
  for (const product of products) {
    if (product.category_id) {
      if (!productsByCategory[product.category_id]) {
        productsByCategory[product.category_id] = [];
      }
      productsByCategory[product.category_id].push(product);
    }
  }

  // Calculate original prices for all specials using batch function (no N+1 queries)
  const productsMap = new Map(products.map(p => [p.id, p]));
  const specialOriginalPrices = calculateSpecialOriginalPricesBatch(specials, productsMap);

  return {
    categories,
    productsByCategory,
    specials,
    specialOriginalPrices,
    customDesignCoverImage,
  };
}

export default async function Home() {
  const homeData = await getHomeData();

  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomeContent
        categories={homeData.categories}
        productsByCategory={homeData.productsByCategory}
        specials={homeData.specials}
        specialOriginalPrices={homeData.specialOriginalPrices}
        customDesignCoverImage={homeData.customDesignCoverImage}
      />
    </Suspense>
  );
}
