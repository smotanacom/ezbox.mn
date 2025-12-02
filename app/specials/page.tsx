import { Suspense } from 'react';
import { getSpecials, getAllProductsWithDetails, calculateSpecialOriginalPricesBatch } from '@/lib/api';
import { SpecialsContent } from '@/components/SpecialsContent';
import { LoadingState } from '@/components/layout';

// Revalidate every 5 minutes
export const revalidate = 300;

async function getSpecialsData() {
  // Fetch specials and products in parallel
  const [specials, products] = await Promise.all([
    getSpecials('available'),
    getAllProductsWithDetails(),
  ]);

  // Calculate original prices using batch function (no N+1)
  const productsMap = new Map(products.map(p => [p.id, p]));
  const specialOriginalPrices = calculateSpecialOriginalPricesBatch(specials, productsMap);

  return {
    specials,
    specialOriginalPrices,
  };
}

export default async function SpecialsPage() {
  const data = await getSpecialsData();

  return (
    <Suspense fallback={<LoadingState />}>
      <SpecialsContent
        specials={data.specials}
        specialOriginalPrices={data.specialOriginalPrices}
      />
    </Suspense>
  );
}
