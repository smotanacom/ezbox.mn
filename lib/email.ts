import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getCartItems } from './api';
import { Order, CartItemWithDetails } from '@/types/database';
import { supabase } from './supabase';

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Fetches all admin email addresses from the database
 * @returns Array of admin email addresses
 */
async function getAdminEmails(): Promise<string[]> {
  try {
    const { data: admins, error } = await supabase
      .from('admins')
      .select('email')
      .not('email', 'is', null);

    if (error) {
      console.error('Failed to fetch admin emails:', error);
      return [];
    }

    // Filter out any null emails and return only valid email strings
    return (admins as { email: string | null }[])
      .map((admin) => admin.email)
      .filter((email): email is string => email !== null && email.length > 0);
  } catch (error) {
    console.error('Error fetching admin emails:', error);
    return [];
  }
}

/**
 * Formats a price in Mongolian Tugrik
 */
function formatPrice(price: number): string {
  return `₮${price.toLocaleString('en-US')}`;
}

/**
 * Formats a date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generates HTML email template for order notification
 */
function generateOrderEmailHTML(order: Order, items: CartItemWithDetails[]): string {
  const itemsHTML = items
    .map((item) => {
      const product = item.product;
      if (!product) return '';

      // Calculate item price
      let itemPrice = product.base_price;

      // Add parameter modifiers
      const selectedParams = item.selected_parameters as any;
      if (selectedParams && product.parameter_groups) {
        for (const [paramGroupId, paramId] of Object.entries(selectedParams)) {
          const paramGroup = product.parameter_groups.find(
            (pg) => pg.id === parseInt(paramGroupId)
          );
          const param = paramGroup?.parameters?.find((p) => p.id === paramId);
          if (param) {
            itemPrice += param.price_modifier;
          }
        }
      }

      const totalItemPrice = itemPrice * item.quantity;

      // Build parameter selection text
      let parameterText = '';
      if (selectedParams && product.parameter_groups) {
        const paramsList: string[] = [];
        for (const [paramGroupId, paramId] of Object.entries(selectedParams)) {
          const paramGroup = product.parameter_groups.find(
            (pg: any) => pg.id === parseInt(paramGroupId)
          );
          const param = paramGroup?.parameters?.find((p: any) => p.id === paramId);
          if (paramGroup && param) {
            paramsList.push(`${(paramGroup as any).name}: ${(param as any).name}`);
          }
        }
        if (paramsList.length > 0) {
          parameterText = `<br><small style="color: #666;">${paramsList.join(', ')}</small>`;
        }
      }

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${product.name}</strong>${parameterText}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            ${formatPrice(itemPrice)}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            <strong>${formatPrice(totalItemPrice)}</strong>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order #${order.id}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">New Order Received</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Order #${order.id}</p>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://ezbox.mn/admin/orders/${order.id}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">View Order in Admin</a>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Order Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Order ID:</strong></td>
                <td style="padding: 8px 0;">#${order.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Status:</strong></td>
                <td style="padding: 8px 0;"><span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${order.status.toUpperCase()}</span></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Date:</strong></td>
                <td style="padding: 8px 0;">${formatDate(order.created_at)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Total:</strong></td>
                <td style="padding: 8px 0;"><strong style="color: #2563eb; font-size: 18px;">${formatPrice(order.total_price)}</strong></td>
              </tr>
            </table>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Customer Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Name:</strong></td>
                <td style="padding: 8px 0;">${order.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Phone:</strong></td>
                <td style="padding: 8px 0;">${order.phone}</td>
              </tr>
              ${order.secondary_phone ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Secondary Phone:</strong></td>
                <td style="padding: 8px 0;">${order.secondary_phone}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6b7280; vertical-align: top;"><strong>Address:</strong></td>
                <td style="padding: 8px 0;">${order.address}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 6px;">
            <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Order Items</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 16px 12px 12px 12px; text-align: right; border-top: 2px solid #e5e7eb;"><strong>Total:</strong></td>
                  <td style="padding: 16px 12px 12px 12px; text-align: right; border-top: 2px solid #e5e7eb;"><strong style="color: #2563eb; font-size: 18px;">${formatPrice(order.total_price)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div style="margin-top: 20px; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">This is an automated notification from EzBox.mn</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} EzBox.mn - All rights reserved</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Sends order notification email to admin
 * @param order - The order object
 * @param cartId - The cart ID to fetch items from
 * @throws Error if email sending fails
 */
export async function sendOrderNotificationEmail(
  order: Order,
  cartId: number
): Promise<void> {
  try {
    // Validate environment variables
    if (!process.env.AWS_SES_ACCESS_KEY_ID || !process.env.AWS_SES_SECRET_ACCESS_KEY) {
      console.warn('AWS SES credentials not configured. Skipping email notification.');
      return;
    }

    if (!process.env.AWS_SES_FROM_EMAIL) {
      console.warn('AWS_SES_FROM_EMAIL not configured. Skipping email notification.');
      return;
    }

    // Fetch admin emails from database
    const adminEmails = await getAdminEmails();
    if (adminEmails.length === 0) {
      console.warn('No admin emails configured. Skipping email notification.');
      return;
    }

    // Fetch cart items
    const items = await getCartItems(cartId);

    // Generate email HTML
    const htmlContent = generateOrderEmailHTML(order, items);

    // Create email command
    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_EMAIL,
      Destination: {
        ToAddresses: adminEmails,
      },
      Message: {
        Subject: {
          Data: `New Order #${order.id} - ${order.name} - ${formatPrice(order.total_price)}`,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlContent,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `
New Order Received - Order #${order.id}

View Order in Admin: https://ezbox.mn/admin/orders/${order.id}

Order Details:
--------------
Order ID: #${order.id}
Status: ${order.status.toUpperCase()}
Date: ${formatDate(order.created_at)}
Total: ${formatPrice(order.total_price)}

Customer Information:
--------------------
Name: ${order.name}
Phone: ${order.phone}
${order.secondary_phone ? `Secondary Phone: ${order.secondary_phone}\n` : ''}Address: ${order.address}

Order Items:
-----------
${items.map((item) => {
  const product = item.product;
  if (!product) return '';

  let itemPrice = product.base_price;
  const selectedParams = item.selected_parameters as any;
  if (selectedParams && product.parameter_groups) {
    for (const [paramGroupId, paramId] of Object.entries(selectedParams)) {
      const paramGroup = product.parameter_groups.find(
        (pg) => pg.id === parseInt(paramGroupId)
      );
      const param = paramGroup?.parameters?.find((p) => p.id === paramId);
      if (param) {
        itemPrice += param.price_modifier;
      }
    }
  }

  const totalItemPrice = itemPrice * item.quantity;
  return `${product.name} x ${item.quantity} = ${formatPrice(totalItemPrice)}`;
}).join('\n')}

Total: ${formatPrice(order.total_price)}

---
This is an automated notification from EzBox.mn
            `.trim(),
            Charset: 'UTF-8',
          },
        },
      },
    });

    // Send email
    await sesClient.send(command);
    console.log(`Order notification email sent successfully for order #${order.id}`);
  } catch (error) {
    // Log error but don't throw - we don't want email failures to break order creation
    console.error('Failed to send order notification email:', error);
    throw error; // Re-throw so the caller can decide whether to fail the order
  }
}

/**
 * Generates HTML email template for custom design request
 */
function generateCustomDesignEmailHTML(phone: string, description?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Custom Design Request</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">New Custom Design Request</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">${new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}</p>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Contact Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; vertical-align: top;"><strong>Phone Number:</strong></td>
                <td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #2563eb; text-decoration: none; font-size: 18px; font-weight: 600;">${phone}</a></td>
              </tr>
            </table>
          </div>

          ${description ? `
          <div style="background-color: white; padding: 20px; border-radius: 6px;">
            <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Project Description</h2>
            <div style="padding: 12px; background-color: #f9fafb; border-left: 4px solid #2563eb; border-radius: 4px;">
              <p style="margin: 0; white-space: pre-wrap; color: #374151;">${description}</p>
            </div>
          </div>
          ` : `
          <div style="background-color: white; padding: 20px; border-radius: 6px;">
            <p style="margin: 0; color: #6b7280; font-style: italic;">No project description provided.</p>
          </div>
          `}
        </div>

        <div style="margin-top: 20px; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">This is an automated notification from EzBox.mn</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} EzBox.mn - All rights reserved</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Sends custom design request notification email to admin
 * @param phone - Customer's phone number
 * @param description - Optional project description
 * @throws Error if email sending fails
 */
export async function sendCustomDesignRequestEmail(
  phone: string,
  description?: string
): Promise<void> {
  try {
    // Validate environment variables
    if (!process.env.AWS_SES_ACCESS_KEY_ID || !process.env.AWS_SES_SECRET_ACCESS_KEY) {
      console.warn('AWS SES credentials not configured. Skipping email notification.');
      return;
    }

    if (!process.env.AWS_SES_FROM_EMAIL) {
      console.warn('AWS_SES_FROM_EMAIL not configured. Skipping email notification.');
      return;
    }

    // Fetch admin emails from database
    const adminEmails = await getAdminEmails();
    if (adminEmails.length === 0) {
      console.warn('No admin emails configured. Skipping email notification.');
      return;
    }

    // Generate email HTML
    const htmlContent = generateCustomDesignEmailHTML(phone, description);

    // Create email command
    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_EMAIL,
      Destination: {
        ToAddresses: adminEmails,
      },
      Message: {
        Subject: {
          Data: `New Custom Design Request - ${phone}`,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlContent,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `
New Custom Design Request

Contact Information:
-------------------
Phone Number: ${phone}

${description ? `Project Description:\n-------------------\n${description}\n` : 'No project description provided.'}

---
This is an automated notification from EzBox.mn
            `.trim(),
            Charset: 'UTF-8',
          },
        },
      },
    });

    // Send email
    await sesClient.send(command);
    console.log(`Custom design request email sent successfully for phone: ${phone}`);
  } catch (error) {
    // Log error but don't throw - we don't want email failures to break the request
    console.error('Failed to send custom design request email:', error);
    throw error; // Re-throw so the caller can decide whether to fail the request
  }
}
