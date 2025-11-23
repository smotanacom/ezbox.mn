'use server';

import { sendCustomDesignRequestEmail } from '@/lib/email';

interface CustomDesignRequestData {
  phone: string;
  description?: string;
}

interface CustomDesignRequestResult {
  success: boolean;
  error?: string;
}

/**
 * Server action to handle custom design request form submissions
 * Sends an email notification to the admin email address
 */
export async function submitCustomDesignRequest(
  data: CustomDesignRequestData
): Promise<CustomDesignRequestResult> {
  try {
    // Validate phone number
    if (!data.phone || data.phone.trim().length === 0) {
      return {
        success: false,
        error: 'Phone number is required',
      };
    }

    const phone = data.phone.trim();

    // Basic phone validation (8 digits for Mongolian numbers)
    if (!/^\d{8}$/.test(phone)) {
      return {
        success: false,
        error: 'Please enter a valid 8-digit phone number',
      };
    }

    // Send email notification
    await sendCustomDesignRequestEmail(phone, data.description);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error submitting custom design request:', error);
    return {
      success: false,
      error: 'Failed to submit request. Please try again later.',
    };
  }
}
