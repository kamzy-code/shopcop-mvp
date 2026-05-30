import { describe, it, expect } from 'vitest';
import {
  transactionItemSchema,
  createTransactionSchema,
  updateTransactionSchema,
  updateTransactionStatusSchema,
  confirmPaymentSchema,
  submitPaymentProofSchema,
  cancelTransactionSchema,
  transactionFiltersSchema,
} from '@validators/transactionValidator.js';

// ─── transactionItemSchema ──────────────────────────────────────────────────

describe('transactionItemSchema', () => {
  it('accepts valid item input', () => {
    const result = transactionItemSchema.safeParse({
      item_name: 'Widget',
      item_price: 1500,
      quantity: 2,
    });
    expect(result.success).toBe(true);
  });

  it('accepts item with all optional fields', () => {
    const result = transactionItemSchema.safeParse({
      product_id: 'ckl3xyzabc1234567890',
      item_name: 'Widget Pro',
      item_price: 2500,
      quantity: 1,
      item_image_url: 'https://example.com/img.jpg',
      variant: 'Large',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty item name', () => {
    const result = transactionItemSchema.safeParse({
      item_name: '',
      item_price: 100,
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = transactionItemSchema.safeParse({
      item_name: 'Test',
      item_price: -100,
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero quantity', () => {
    const result = transactionItemSchema.safeParse({
      item_name: 'Test',
      item_price: 100,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer quantity', () => {
    const result = transactionItemSchema.safeParse({
      item_name: 'Test',
      item_price: 100,
      quantity: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

// ─── createTransactionSchema ────────────────────────────────────────────────

describe('createTransactionSchema', () => {
  const validPayload = {
    delivery_method: 'PICKUP',
    items: [{ item_name: 'Widget', item_price: 1000, quantity: 1 }],
  };

  it('accepts valid create payload', () => {
    const result = createTransactionSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('accepts payload with all optional fields', () => {
    const result = createTransactionSchema.safeParse({
      ...validPayload,
      buyer_email: 'buyer@example.com',
      expected_delivery_start: '2026-06-01',
      expected_delivery_end: '2026-06-05',
      delivery_fee: 500,
      discount_amount: 200,
      order_notes: 'Please handle with care',
      vendor_notes: 'Internal note',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing delivery method', () => {
    const result = createTransactionSchema.safeParse({
      items: [{ item_name: 'Widget', item_price: 1000, quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty items array', () => {
    const result = createTransactionSchema.safeParse({
      delivery_method: 'PICKUP',
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects delivery window where start > end', () => {
    const result = createTransactionSchema.safeParse({
      delivery_method: 'PICKUP',
      items: [{ item_name: 'Widget', item_price: 1000, quantity: 1 }],
      expected_delivery_start: '2026-06-10',
      expected_delivery_end: '2026-06-05',
    });
    expect(result.success).toBe(false);
  });

  it('applies default values for delivery_fee and discount_amount', () => {
    const result = createTransactionSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.delivery_fee).toBe(0);
      expect(result.data.discount_amount).toBe(0);
    }
  });
});

// ─── updateTransactionSchema ────────────────────────────────────────────────

describe('updateTransactionSchema', () => {
  it('accepts partial update payload', () => {
    const result = updateTransactionSchema.safeParse({
      buyer_email: 'new@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts full replacement with items', () => {
    const result = updateTransactionSchema.safeParse({
      items: [{ item_name: 'New Item', item_price: 2000, quantity: 3 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid delivery method', () => {
    const result = updateTransactionSchema.safeParse({
      delivery_method: 'INVALID',
    });
    expect(result.success).toBe(false);
  });
});

// ─── updateTransactionStatusSchema ──────────────────────────────────────────

describe('updateTransactionStatusSchema', () => {
  const validTransitions = [
    'IN_PROGRESS', 'READY_FOR_DISPATCH', 'SHIPPED', 'DELIVERED',
    'COMPLETED', 'REFUND_REQUESTED', 'REFUND_IN_PROGRESS', 'REFUNDED', 'RESOLVED',
  ];

  validTransitions.forEach((status) => {
    it(`accepts status ${status}`, () => {
      const result = updateTransactionStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    });
  });

  it('rejects CONFIRMED (must use confirmPayment)', () => {
    const result = updateTransactionStatusSchema.safeParse({ status: 'CONFIRMED' });
    expect(result.success).toBe(false);
  });

  it('rejects CANCELLED (must use cancelTransaction)', () => {
    const result = updateTransactionStatusSchema.safeParse({ status: 'CANCELLED' });
    expect(result.success).toBe(false);
  });

  it('accepts optional note', () => {
    const result = updateTransactionStatusSchema.safeParse({
      status: 'DELIVERED',
      note: 'Handed to customer',
    });
    expect(result.success).toBe(true);
  });
});

// ─── confirmPaymentSchema ───────────────────────────────────────────────────

describe('confirmPaymentSchema', () => {
  it('accepts empty payload', () => {
    const result = confirmPaymentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts payment notes', () => {
    const result = confirmPaymentSchema.safeParse({ payment_notes: 'Paid via transfer' });
    expect(result.success).toBe(true);
  });
});

// ─── submitPaymentProofSchema ───────────────────────────────────────────────

describe('submitPaymentProofSchema', () => {
  it('accepts empty payload', () => {
    const result = submitPaymentProofSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts email and proof URL', () => {
    const result = submitPaymentProofSchema.safeParse({
      buyer_email: 'buyer@example.com',
      payment_proof_url: 'https://cdn.example.com/proof.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL', () => {
    const result = submitPaymentProofSchema.safeParse({
      payment_proof_url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

// ─── cancelTransactionSchema ────────────────────────────────────────────────

describe('cancelTransactionSchema', () => {
  it('accepts valid reason', () => {
    const result = cancelTransactionSchema.safeParse({
      reason: 'Buyer requested cancellation via phone call.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short reason (< 10 chars)', () => {
    const result = cancelTransactionSchema.safeParse({ reason: 'Too short' });
    expect(result.success).toBe(false);
  });
});

// ─── transactionFiltersSchema ───────────────────────────────────────────────

describe('transactionFiltersSchema', () => {
  it('applies defaults for empty payload', () => {
    const result = transactionFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sort).toBe('newest');
    }
  });

  it('accepts valid filter params', () => {
    const result = transactionFiltersSchema.safeParse({
      status: 'PENDING',
      page: '2',
      limit: '10',
      sort: 'amount_desc',
    });
    expect(result.success).toBe(true);
  });

  it('rejects page below 1', () => {
    const result = transactionFiltersSchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects limit above 100', () => {
    const result = transactionFiltersSchema.safeParse({ limit: '200' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid sort value', () => {
    const result = transactionFiltersSchema.safeParse({ sort: 'invalid' });
    expect(result.success).toBe(false);
  });
});
