import { prisma } from '@config/prisma.js';
import { RefundStatus, TransactionStatus } from '../generated/prisma/enums.js';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateTrackingToken(): string {
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return token;
}

export async function generateTransactionReference(vendorId: string): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 3; attempt++) {
    const count = await prisma.transaction.count({
      where: {
        vendor_id: vendorId,
        created_at: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });
    const ref = `SC-${year}-${String(count + 1 + attempt).padStart(5, '0')}`;
    const exists = await prisma.transaction.findUnique({ where: { reference: ref } });
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

const STATUS_TIMESTAMP_MAP: Partial<Record<TransactionStatus, string>> = {
  // CONFIRMED is intentionally excluded — confirmed_at is only set by confirmPayment,
  // not by the generic updateTransactionStatus path.
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

export function getStatusTimestampField(status: TransactionStatus): string | undefined {
  return STATUS_TIMESTAMP_MAP[status];
}

const VALID_TRANSITIONS: Record<string, TransactionStatus[]> = {
  // CONFIRMED is excluded from PENDING — the only path from PENDING → CONFIRMED
  // is via confirmPayment, which also sets payment_status=PAID and deducts stock.
  // Allowing it here through updateTransactionStatus would corrupt data.
  PENDING: [TransactionStatus.CANCELLED],
  CONFIRMED: [TransactionStatus.IN_PROGRESS, TransactionStatus.CANCELLED],
  IN_PROGRESS: [TransactionStatus.READY_FOR_DISPATCH, TransactionStatus.CANCELLED],
  READY_FOR_DISPATCH: [TransactionStatus.SHIPPED, TransactionStatus.CANCELLED],
  SHIPPED: [TransactionStatus.DELIVERED],
  // COMPLETED is intentionally excluded from DELIVERED — the only path from
  // DELIVERED → COMPLETED is via buyerConfirmDelivery() (buyer "I've Received It" btn)
  // or the 48-hour auto-close. Vendors can only push up to DELIVERED.
  DELIVERED: [TransactionStatus.REFUND_REQUESTED],
  REFUND_REQUESTED: [TransactionStatus.REFUND_IN_PROGRESS, TransactionStatus.RESOLVED],
  REFUND_IN_PROGRESS: [TransactionStatus.REFUNDED, TransactionStatus.RESOLVED],
  // COMPLETED is excluded from REFUNDED/RESOLVED for the same reason — auto-close handles it.
  REFUNDED: [],
  RESOLVED: [],
  COMPLETED: [], // Terminal — no further transitions
  CANCELLED: [],
};

export function isTransitionValid(from: TransactionStatus, to: TransactionStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export const NON_CANCELLABLE_STATUSES: TransactionStatus[] = [
  TransactionStatus.SHIPPED,
  TransactionStatus.DELIVERED,
  TransactionStatus.COMPLETED,
  TransactionStatus.REFUND_REQUESTED,
  TransactionStatus.REFUND_IN_PROGRESS,
  TransactionStatus.REFUNDED,
  TransactionStatus.RESOLVED,
  TransactionStatus.CANCELLED,
];

export const REFUND_STATUS_SYNC: Partial<Record<TransactionStatus, RefundStatus>> = {
  [TransactionStatus.REFUND_REQUESTED]: RefundStatus.REQUESTED,
  [TransactionStatus.REFUND_IN_PROGRESS]: RefundStatus.IN_PROGRESS,
  [TransactionStatus.REFUNDED]: RefundStatus.REFUNDED,
  [TransactionStatus.RESOLVED]: RefundStatus.RESOLVED,
} as const;
