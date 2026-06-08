import { prisma } from '@config/prisma.js';
import { RefundStatus, OrderStatus } from '../generated/prisma/enums.js';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateTrackingToken(): string {
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return token;
}

export async function generateOrderReference(vendorId: string): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 3; attempt++) {
    const count = await prisma.order.count({
      where: {
        vendor_id: vendorId,
        created_at: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    const ref = `SC-${year}-${String(count + 1 + attempt).padStart(5, '0')}`;
    const exists = await prisma.order.findUnique({ where: { reference: ref } });
    if (!exists) return ref;
  }
  // Fallback: use timestamp-based suffix to guarantee uniqueness 
  // Replace with DB Sequence at Scale (CREATE SEQUENCE)
  return `SC-${year}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

export function calculateSubtotal(items: { item_price: number; quantity: number }[]): number {
  // Use integer (kobo) arithmetic to avoid JS floating-point errors
  const totalKobo = items.reduce(
    (sum, item) => sum + Math.round(item.item_price * 100) * item.quantity,
    0,
  );
  return totalKobo / 100;
}

export function calculateTotal(subtotal: number, deliveryFee = 0, discount = 0): number {
  const totalKobo =
    Math.round(subtotal * 100) +
    Math.round(deliveryFee * 100) -
    Math.round(discount * 100);
  return Math.max(0, totalKobo) / 100;
}

const STATUS_TIMESTAMP_MAP: Partial<Record<OrderStatus, string>> = {
  // CONFIRMED is intentionally excluded — confirmed_at is only set by confirmPayment,
  // not by the generic updateOrderStatus path.
  IN_PROGRESS: 'in_progress_at',
  READY_FOR_DISPATCH: 'ready_for_dispatch_at',
  SHIPPED: 'shipped_at',
  DELIVERED: 'delivered_at',
  COMPLETED: 'completed_at',
  CANCELLED: 'cancelled_at',
  REFUND_REQUESTED: 'refund_initiated_at',
  REFUNDED: 'refunded_at',
  RESOLVED: 'resolved_at',
};

export function getStatusTimestampField(status: OrderStatus): string | undefined {
  return STATUS_TIMESTAMP_MAP[status];
}

const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  // CONFIRMED is excluded from PENDING — the only path from PENDING → CONFIRMED
  // is via confirmPayment, which also sets payment_status=PAID and deducts stock.
  // Allowing it here through updateOrderStatus would corrupt data.
  PENDING: [OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  IN_PROGRESS: [OrderStatus.READY_FOR_DISPATCH, OrderStatus.CANCELLED],
  READY_FOR_DISPATCH: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED],
  // COMPLETED is intentionally excluded from DELIVERED — the only path from
  // DELIVERED → COMPLETED is via buyerConfirmDelivery() (buyer "I've Received It" btn)
  // or the 48-hour auto-close. Vendors can only push up to DELIVERED.
  DELIVERED: [OrderStatus.REFUND_REQUESTED],
  REFUND_REQUESTED: [OrderStatus.REFUND_IN_PROGRESS, OrderStatus.RESOLVED],
  REFUND_IN_PROGRESS: [OrderStatus.REFUNDED, OrderStatus.RESOLVED],
  // COMPLETED is excluded from REFUNDED/RESOLVED for the same reason — auto-close handles it.
  REFUNDED: [],
  RESOLVED: [],
  COMPLETED: [], // Terminal — no further transitions
  CANCELLED: [],
};

export function isTransitionValid(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export const NON_CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
  OrderStatus.REFUND_REQUESTED,
  OrderStatus.REFUND_IN_PROGRESS,
  OrderStatus.REFUNDED,
  OrderStatus.RESOLVED,
  OrderStatus.CANCELLED,
];

export const REFUND_STATUS_SYNC: Partial<Record<OrderStatus, RefundStatus>> = {
  [OrderStatus.REFUND_REQUESTED]: RefundStatus.REQUESTED,
  [OrderStatus.REFUND_IN_PROGRESS]: RefundStatus.IN_PROGRESS,
  [OrderStatus.REFUNDED]: RefundStatus.REFUNDED,
  [OrderStatus.RESOLVED]: RefundStatus.RESOLVED,
} as const;
