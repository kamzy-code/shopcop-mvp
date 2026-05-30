import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@config/prisma.js', () => ({
  prisma: {
    transaction: { count: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from '@config/prisma.js';
import {
  generateTrackingToken,
  generateTransactionReference,
  calculateSubtotal,
  calculateTotal,
  getStatusTimestampField,
  isTransitionValid,
  NON_CANCELLABLE_STATUSES,
  REFUND_STATUS_SYNC,
} from '@utils/transactionUtils.js';
import { TransactionStatus, RefundStatus } from 'generated/prisma/enums.js';

const mockPrisma = prisma as any;

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── generateTrackingToken ───────────────────────────────────────────────────

describe('generateTrackingToken', () => {
  it('returns a 12-character alphanumeric string', () => {
    const token = generateTrackingToken();
    expect(token).toHaveLength(12);
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('produces different values on successive calls', () => {
    const a = generateTrackingToken();
    const b = generateTrackingToken();
    expect(a).not.toBe(b);
  });
});

// ─── generateTransactionReference ───────────────────────────────────────────

describe('generateTransactionReference', () => {
  it('generates a reference in format SC-YYYY-NNNNN', async () => {
    mockPrisma.transaction.count.mockResolvedValue(5);
    mockPrisma.transaction.findUnique.mockResolvedValue(null);

    const ref = await generateTransactionReference('vendor-1');

    expect(ref).toMatch(/^SC-\d{4}-00006$/);
  });

  it('retries on collision and falls back to timestamp suffix', async () => {
    mockPrisma.transaction.count.mockResolvedValue(0);
    // All 3 attempts collide
    mockPrisma.transaction.findUnique
      .mockResolvedValueOnce({ reference: 'SC-2026-00001' })
      .mockResolvedValueOnce({ reference: 'SC-2026-00002' })
      .mockResolvedValueOnce({ reference: 'SC-2026-00003' });

    const ref = await generateTransactionReference('vendor-1');

    expect(ref).toMatch(/^SC-\d{4}-[A-Z0-9]{5}$/);
  });
});

// ─── calculateSubtotal ──────────────────────────────────────────────────────

describe('calculateSubtotal', () => {
  it('sums price * quantity for all items', () => {
    const items = [
      { item_price: 1000, quantity: 2 },
      { item_price: 500, quantity: 3 },
    ];
    expect(calculateSubtotal(items)).toBe(3500);
  });

  it('uses kobo arithmetic to avoid floating point errors', () => {
    const items = [
      { item_price: 0.1, quantity: 3 },
    ];
    expect(calculateSubtotal(items)).toBe(0.3);
  });

  it('returns 0 for empty array', () => {
    expect(calculateSubtotal([])).toBe(0);
  });
});

// ─── calculateTotal ─────────────────────────────────────────────────────────

describe('calculateTotal', () => {
  it('adds delivery fee and subtracts discount', () => {
    expect(calculateTotal(5000, 1000, 500)).toBe(5500);
  });

  it('clamps to 0 when discount exceeds subtotal + fee', () => {
    expect(calculateTotal(1000, 0, 2000)).toBe(0);
  });

  it('defaults delivery fee and discount to 0', () => {
    expect(calculateTotal(5000)).toBe(5000);
  });
});

// ─── getStatusTimestampField ────────────────────────────────────────────────

describe('getStatusTimestampField', () => {
  it('returns the correct timestamp field for each status', () => {
    expect(getStatusTimestampField(TransactionStatus.IN_PROGRESS)).toBe('in_progress_at');
    expect(getStatusTimestampField(TransactionStatus.SHIPPED)).toBe('shipped_at');
    expect(getStatusTimestampField(TransactionStatus.DELIVERED)).toBe('delivered_at');
    expect(getStatusTimestampField(TransactionStatus.COMPLETED)).toBe('completed_at');
  });

  it('returns undefined for CONFIRMED (no timestamp field)', () => {
    expect(getStatusTimestampField(TransactionStatus.CONFIRMED)).toBeUndefined();
  });

  it('returns undefined for unknown status', () => {
    expect(getStatusTimestampField('FAKE_STATUS' as any)).toBeUndefined();
  });
});

// ─── isTransitionValid ──────────────────────────────────────────────────────

describe('isTransitionValid', () => {
  it('allows valid transitions', () => {
    expect(isTransitionValid(TransactionStatus.CONFIRMED, TransactionStatus.IN_PROGRESS)).toBe(true);
    expect(isTransitionValid(TransactionStatus.SHIPPED, TransactionStatus.DELIVERED)).toBe(true);
    expect(isTransitionValid(TransactionStatus.DELIVERED, TransactionStatus.COMPLETED)).toBe(true);
  });

  it('rejects transitions not in the state machine', () => {
    expect(isTransitionValid(TransactionStatus.PENDING, TransactionStatus.COMPLETED)).toBe(false);
    expect(isTransitionValid(TransactionStatus.SHIPPED, TransactionStatus.IN_PROGRESS)).toBe(false);
    expect(isTransitionValid(TransactionStatus.COMPLETED, TransactionStatus.PENDING)).toBe(false);
  });

  it('rejects PENDING → CONFIRMED (must use confirmPayment)', () => {
    expect(isTransitionValid(TransactionStatus.PENDING, TransactionStatus.CONFIRMED)).toBe(false);
  });

  it('rejects CANCELLED → anything', () => {
    expect(isTransitionValid(TransactionStatus.CANCELLED, TransactionStatus.PENDING)).toBe(false);
    expect(isTransitionValid(TransactionStatus.CANCELLED, TransactionStatus.CONFIRMED)).toBe(false);
  });

  it('returns false for completely unknown from-status', () => {
    expect(isTransitionValid('FAKE' as any, TransactionStatus.PENDING)).toBe(false);
  });
});

// ─── NON_CANCELLABLE_STATUSES ───────────────────────────────────────────────

describe('NON_CANCELLABLE_STATUSES', () => {
  it('includes SHIPPED, DELIVERED, COMPLETED, and refund states', () => {
    expect(NON_CANCELLABLE_STATUSES).toContain(TransactionStatus.SHIPPED);
    expect(NON_CANCELLABLE_STATUSES).toContain(TransactionStatus.DELIVERED);
    expect(NON_CANCELLABLE_STATUSES).toContain(TransactionStatus.COMPLETED);
    expect(NON_CANCELLABLE_STATUSES).toContain(TransactionStatus.REFUND_REQUESTED);
    expect(NON_CANCELLABLE_STATUSES).toContain(TransactionStatus.REFUNDED);
    expect(NON_CANCELLABLE_STATUSES).toContain(TransactionStatus.CANCELLED);
  });

  it('does not include PENDING or CONFIRMED or IN_PROGRESS', () => {
    expect(NON_CANCELLABLE_STATUSES).not.toContain(TransactionStatus.PENDING);
    expect(NON_CANCELLABLE_STATUSES).not.toContain(TransactionStatus.CONFIRMED);
    expect(NON_CANCELLABLE_STATUSES).not.toContain(TransactionStatus.IN_PROGRESS);
  });
});

// ─── REFUND_STATUS_SYNC ─────────────────────────────────────────────────────

describe('REFUND_STATUS_SYNC', () => {
  it('maps refund status transitions correctly', () => {
    expect(REFUND_STATUS_SYNC[TransactionStatus.REFUND_REQUESTED]).toBe(RefundStatus.REQUESTED);
    expect(REFUND_STATUS_SYNC[TransactionStatus.REFUND_IN_PROGRESS]).toBe(RefundStatus.IN_PROGRESS);
    expect(REFUND_STATUS_SYNC[TransactionStatus.REFUNDED]).toBe(RefundStatus.REFUNDED);
    expect(REFUND_STATUS_SYNC[TransactionStatus.RESOLVED]).toBe(RefundStatus.RESOLVED);
  });

  it('has no entry for non-refund statuses', () => {
    expect(REFUND_STATUS_SYNC[TransactionStatus.COMPLETED]).toBeUndefined();
    expect(REFUND_STATUS_SYNC[TransactionStatus.CANCELLED]).toBeUndefined();
  });
});
