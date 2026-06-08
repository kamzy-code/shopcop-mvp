import { DeliveryMethod } from '../generated/prisma/enums.js';

/** Input for a single line item within an order. */
export interface OrderItemInput {
  product_id?: string;
  item_name: string;
  item_price: number;
  quantity: number;
  item_image_url?: string;
  description?: string;
}

/** Payload for creating a new order. */
export interface CreateOrderInput {
  buyer_email?: string;
  delivery_method: DeliveryMethod;
  expected_delivery_start?: Date;
  expected_delivery_end?: Date;
  items: OrderItemInput[];
  delivery_fee?: number;
  discount_amount?: number;
  order_notes?: string;
  vendor_notes?: string;
}

/** Payload for updating an existing order (all fields optional). */
export interface UpdateOrderInput {
  buyer_email?: string;
  delivery_method?: DeliveryMethod;
  expected_delivery_start?: Date;
  expected_delivery_end?: Date;
  items?: OrderItemInput[];
  delivery_fee?: number;
  discount_amount?: number;
  order_notes?: string;
  vendor_notes?: string;
}

/** Filters and pagination options for listing orders. */
export interface OrderFilters {
  status?: string;
  refund_status?: string;
  payment_status?: string;
  search?: string;
  page: number;
  limit: number;
  sort: 'newest' | 'oldest' | 'amount_asc' | 'amount_desc';
  from_date?: Date;
  to_date?: Date;
}

/** Pagination metadata returned alongside a paginated list. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
