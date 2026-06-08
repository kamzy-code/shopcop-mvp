import { z } from 'zod';
import { DeliveryMethod } from 'generated/prisma/enums.js';

export const orderItemSchema = z.object({
  product_id: z.cuid2('Invalid product ID').optional(),
  item_name: z.string().min(1, 'Item name is required').max(200, 'Item name too long'),
  item_price: z.number().min(1, 'Price must be at least ₦1').max(10_000_000, 'Price too large'),
  quantity: z.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1'),
  item_image_url: z.url('Enter a valid url for the image').optional(),
  description: z.string().max(500, 'Item description too long').optional(),
});

export const createOrderSchema = z
  .object({
    buyer_email: z.email('Invalid email address').optional().or(z.literal('')),
    delivery_method: z.enum(DeliveryMethod, {
      message: 'Invalid delivery method',
    }),
    expected_delivery_start: z.coerce.date().optional(),
    expected_delivery_end: z.coerce.date().optional(),
    items: z.array(orderItemSchema).min(1, 'At least 1 item is required'),
    delivery_fee: z.number().min(0, 'Delivery fee cannot be negative').default(0),
    discount_amount: z.number().min(0, 'Discount cannot be negative').default(0),
    order_notes: z.string().max(1000, 'Notes too long').optional(),
    vendor_notes: z.string().max(1000, 'Internal notes too long').optional(),
  })
  .refine(
    (data) => {
      if (data.expected_delivery_start && data.expected_delivery_end) {
        return data.expected_delivery_start < data.expected_delivery_end;
      }
      return true;
    },
    { message: 'Delivery start must be before end time', path: ['expected_delivery_end'] }
  );

export const updateOrderSchema = z.object({
  buyer_email: z.email().optional().or(z.literal('')),
  delivery_method: z.enum(DeliveryMethod).optional(),
  expected_delivery_start: z.coerce.date().optional(),
  expected_delivery_end: z.coerce.date().optional(),
  items: z.array(orderItemSchema).min(1, 'At least 1 item is required').optional(),
  delivery_fee: z.number().min(0).optional(),
  discount_amount: z.number().min(0).optional(),
  order_notes: z.string().max(1000).optional(),
  vendor_notes: z.string().max(1000).optional(),
});

// CONFIRMED and CANCELLED are excluded — they have dedicated stock/payment endpoints
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'IN_PROGRESS',
    'READY_FOR_DISPATCH',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'REFUND_REQUESTED',
    'REFUND_IN_PROGRESS',
    'REFUNDED',
    'RESOLVED',
  ]),
  note: z.string().max(500).optional(),
});

export const confirmPaymentSchema = z.object({
  payment_notes: z.string().max(500).optional(),
});

export const submitPaymentProofSchema = z.object({
  buyer_email: z.email('Invalid email address').optional().or(z.literal('')),
  payment_proof_url: z.string().url('Please upload a valid receipt image'),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(10, 'Cancellation reason must be at least 10 characters').max(500),
});

export const buyerCancelOrderSchema = z.object({
  reason: z.string().min(10, 'Cancellation reason must be at least 10 characters').max(500),
});

export const confirmDeliverySchema = z.object({});

export const buyerRefundRequestSchema = z.object({
  reason: z.string().min(10, 'Refund reason must be at least 10 characters').max(1000),
});

export const updateRefundStatusSchema = z.object({
  status: z.enum([
    'IN_PROGRESS',
    'READY_FOR_DISPATCH',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'REFUND_REQUESTED',
    'REFUND_IN_PROGRESS',
    'REFUNDED',
    'RESOLVED',
  ]),
  note: z.string().max(500).optional(),
  refund_amount: z.number().min(0).optional(),
  refund_vendor_notes: z.string().max(1000).optional(),
});

export const orderFiltersSchema = z.object({
  status: z.string().optional(),
  refund_status: z.string().optional(),
  payment_status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['newest', 'oldest', 'amount_asc', 'amount_desc']).default('newest'),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
});

export type CreateOrderSchema = z.infer<typeof createOrderSchema>;
export type UpdateOrderSchema = z.infer<typeof updateOrderSchema>;
export type OrderFiltersSchema = z.infer<typeof orderFiltersSchema>;
