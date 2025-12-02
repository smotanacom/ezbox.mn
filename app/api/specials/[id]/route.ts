import { NextResponse } from 'next/server';
import { getSpecialWithDetails, calculateSpecialOriginalPrice, getProductWithDetails } from '@/lib/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const specialId = parseInt(id);

    if (isNaN(specialId)) {
      return NextResponse.json({ error: 'Invalid special ID' }, { status: 400 });
    }

    const special = await getSpecialWithDetails(specialId);

    if (!special) {
      return NextResponse.json({ error: 'Special not found' }, { status: 404 });
    }

    // Only return available specials for public endpoint
    if (special.status !== 'available') {
      return NextResponse.json({ error: 'Special not found' }, { status: 404 });
    }

    // Calculate original price
    let originalPrice = 0;
    try {
      originalPrice = await calculateSpecialOriginalPrice(specialId);
    } catch (error) {
      console.error(`Error calculating original price for special ${specialId}:`, error);
    }

    // Fetch full product details for each item
    const itemsWithDetails = await Promise.all(
      (special.items || []).map(async (item) => {
        try {
          const productDetails = await getProductWithDetails(item.product_id);
          return {
            ...item,
            productDetails,
          };
        } catch (error) {
          console.error(`Error fetching product details for item ${item.id}:`, error);
          return {
            ...item,
            productDetails: null,
          };
        }
      })
    );

    return NextResponse.json({
      special: {
        ...special,
        items: itemsWithDetails,
      },
      originalPrice,
    });
  } catch (error) {
    console.error('Error fetching special:', error);
    return NextResponse.json({ error: 'Failed to fetch special' }, { status: 500 });
  }
}
