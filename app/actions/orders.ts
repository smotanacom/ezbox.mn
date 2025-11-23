'use server';

import { createOrder as createOrderDB } from '@/lib/api';

/**
 * Server action to create an order
 * This ensures email sending happens server-side where AWS credentials are available
 */
export async function createOrder(
  cartId: number,
  userId: number | null,
  name: string,
  phone: string,
  address: string,
  secondaryPhone?: string
) {
  return await createOrderDB(cartId, userId, name, phone, address, secondaryPhone);
}
