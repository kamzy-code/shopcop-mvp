import z from 'zod';

const itemSchema = z.object({
  product_id: z.string().optional(),
  item_name: z.string().min(1, 'Item name is required'),
  item_price: z.number().min(1, 'Price must be at least ₦1'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  description: z.string().optional(),
});

export const orderFormSchema = z.object({
  delivery_method: z.enum(['PICKUP', 'DISPATCH', 'WAYBILL']),
  expected_delivery_start: z.string().optional(),
  expected_delivery_end: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
  delivery_fee: z.number().min(0).optional(),
  discount_amount: z.number().min(0).optional(),
  order_notes: z.string().optional(),
  vendor_notes: z.string().optional(),
});

export type OrderFormData = z.infer<typeof orderFormSchema>;

export const orderEditSchema = z.object({
  delivery_method: z.enum(['PICKUP', 'DISPATCH', 'WAYBILL']),
  expected_delivery_start: z.string().optional(),
  expected_delivery_end: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
  delivery_fee: z.number().min(0).optional(),
  discount_amount: z.number().min(0).optional(),
  order_notes: z.string().optional(),
  vendor_notes: z.string().optional(),
});

export type OrderEditData = z.infer<typeof orderEditSchema>;
