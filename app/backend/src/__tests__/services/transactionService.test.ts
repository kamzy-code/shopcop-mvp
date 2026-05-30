import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from '@prisma/client/runtime/client';

const mock$transaction = vi.hoisted(() => vi.fn());

vi.mock('@config/prisma.js', () => ({
  prisma: {
    $transaction: mock$transaction,
    vendorProfile: { findUnique: vi.fn() },
    transaction: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    transactionItem: { update: vi.fn(), deleteMany: vi.fn() },
    transactionStatusHistory: { create: vi.fn() },
  },
}));

vi.mock('@utils/transactionUtils.js', async () => {
  const actual = await vi.importActual('@utils/transactionUtils.js');
  return {
    ...(actual as any),
    generateTrackingToken: vi.fn(() => 'mockToken12345'),
    generateTransactionReference: vi.fn(() => Promise.resolve('SC-2026-00001')),
  };
});

import { TransactionService } from '@services/transactionService.js';
import { prisma } from '@config/prisma.js';
import { TransactionStatus } from 'generated/prisma/enums.js';

const mockPrisma = prisma as any;

const mockTx = (
  overrides: Record<string, any> = {},
) => ({
  transaction: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  product: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  transactionItem: {
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  transactionStatusHistory: { create: vi.fn() },
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();

  // $transaction executes the callback immediately
  mock$transaction.mockImplementation(
    (cb: (tx: any) => any) => cb(mockTx()),
  );

  // Default vendor lookup succeeds
  mockPrisma.vendorProfile.findUnique.mockResolvedValue({
    id: 'vendor-1',
    user_id: 'user-1',
    personal_info_complete: true,
    business_info_complete: true,
  });
});

const mockTransaction = {
  id: 'tx-1',
  reference: 'SC-2026-00001',
  tracking_token: 'abc123',
  vendor_id: 'vendor-1',
  status: 'PENDING',
  payment_status: 'UNPAID',
  subtotal: new Decimal(5000),
  delivery_fee: new Decimal(500),
  discount_amount: new Decimal(0),
  total_amount: new Decimal(5500),
  buyer_email: null,
  delivery_method: 'PICKUP',
  order_notes: null,
  vendor_notes: null,
  created_at: new Date(),
  items: [
    {
      id: 'item-1',
      product_id: 'prod-1',
      item_name: 'Widget',
      item_price: new Decimal(2500),
      quantity: 2,
      subtotal: new Decimal(5000),
      stock_deducted: 0,
      item_image_url: null,
      variant: null,
      transaction_id: 'tx-1',
      created_at: new Date(),
    },
  ],
  vendor: {
    id: 'vendor-1',
    business_name: 'Test Vendor',
    profile_photo_url: null,
    current_tier: 'BRONZE',
    whatsapp_number: '+2348000000000',
  },
  status_history: [],
  review: null,
};

// ─── createTransaction ─────────────────────────────────────────────────────

describe('TransactionService.createTransaction', () => {
  it('creates a transaction with valid input', async () => {
    mockPrisma.transaction.create.mockResolvedValue(mockTransaction);

    const result = await TransactionService.createTransaction('user-1', {
      delivery_method: 'PICKUP' as any,
      items: [{ item_name: 'Widget', item_price: 2500, quantity: 2 }],
    });

    expect(result.id).toBe('tx-1');
    expect(mockPrisma.transaction.create).toHaveBeenCalledOnce();
  });

  it('throws 404 when vendor profile not found', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(null);

    await expect(
      TransactionService.createTransaction('unknown-user', {
        delivery_method: 'PICKUP' as any,
        items: [{ item_name: 'Test', item_price: 100, quantity: 1 }],
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when profile is incomplete', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue({
      id: 'vendor-1',
      personal_info_complete: false,
      business_info_complete: false,
    });

    await expect(
      TransactionService.createTransaction('user-1', {
        delivery_method: 'PICKUP' as any,
        items: [{ item_name: 'Test', item_price: 100, quantity: 1 }],
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── getTransaction ─────────────────────────────────────────────────────────

describe('TransactionService.getTransaction', () => {
  it('returns transaction when found and owned by vendor', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    const result = await TransactionService.getTransaction('tx-1', 'user-1');

    expect(result.id).toBe('tx-1');
  });

  it('throws 404 when transaction not found', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(null);

    await expect(
      TransactionService.getTransaction('missing', 'user-1'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when transaction belongs to another vendor', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue({
      id: 'vendor-2',
      user_id: 'user-2',
      personal_info_complete: true,
      business_info_complete: true,
    });
    mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    await expect(
      TransactionService.getTransaction('tx-1', 'user-2'),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── getTransactionByToken ──────────────────────────────────────────────────

describe('TransactionService.getTransactionByToken', () => {
  it('returns transaction when token matches', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    const result = await TransactionService.getTransactionByToken('abc123');

    expect(result.id).toBe('tx-1');
  });

  it('throws 404 when token not found', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(null);

    await expect(
      TransactionService.getTransactionByToken('bad-token'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── submitPaymentProof ─────────────────────────────────────────────────────

describe('TransactionService.submitPaymentProof', () => {
  it('submits payment proof successfully', async () => {
    mockPrisma.transaction.findUnique
      .mockResolvedValueOnce(mockTransaction);
    mockPrisma.transaction.update.mockResolvedValue({
      ...mockTransaction,
      payment_status: 'PROOF_SUBMITTED',
    });

    const result = await TransactionService.submitPaymentProof('abc123', {
      buyer_email: 'buyer@test.com',
      payment_proof_url: 'https://cdn.test/proof.jpg',
    });

    expect(result.payment_status).toBe('PROOF_SUBMITTED');
  });

  it('throws 404 when transaction not found', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(null);

    await expect(
      TransactionService.submitPaymentProof('bad-token', {}),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when payment proof already submitted', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      ...mockTransaction,
      payment_status: 'PROOF_SUBMITTED',
    });

    await expect(
      TransactionService.submitPaymentProof('abc123', {}),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── updateTransactionStatus ────────────────────────────────────────────────

describe('TransactionService.updateTransactionStatus', () => {
  it('updates status for valid transition', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue({
      ...mockTransaction,
      status: 'CONFIRMED',
    });
    // $transaction callback
    mock$transaction.mockImplementation(
      (cb: (tx: any) => any) => cb(mockTx({
        transaction: {
          findUnique: vi.fn().mockResolvedValue({
            ...mockTransaction,
            status: 'CONFIRMED',
          }),
          update: vi.fn().mockResolvedValue({
            ...mockTransaction,
            status: 'IN_PROGRESS',
          }),
        },
      })),
    );

    const result = await TransactionService.updateTransactionStatus(
      'tx-1', 'user-1', TransactionStatus.IN_PROGRESS,
    );

    expect(result.status).toBe('IN_PROGRESS');
  });

  it('throws 400 for invalid transition', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);

    await expect(
      TransactionService.updateTransactionStatus('tx-1', 'user-1', TransactionStatus.COMPLETED),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── cancelTransaction ─────────────────────────────────────────────────────

describe('TransactionService.cancelTransaction', () => {
  it('cancels a cancellable transaction', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    mock$transaction.mockImplementation(
      (cb: (tx: any) => any) => cb(mockTx({
        transaction: {
          findUnique: vi.fn().mockResolvedValue(mockTransaction),
          update: vi.fn().mockResolvedValue({
            ...mockTransaction,
            status: 'CANCELLED',
            cancelled_by: 'user-1',
            cancellation_reason: 'Buyer requested cancellation via phone.',
          }),
        },
      })),
    );

    const result = await TransactionService.cancelTransaction(
      'tx-1', 'user-1', 'Buyer requested cancellation via phone.',
    );

    expect(result.status).toBe('CANCELLED');
  });
});

// ─── getVendorTransactions ─────────────────────────────────────────────────

describe('TransactionService.getVendorTransactions', () => {
  it('returns paginated transactions', async () => {
    mockPrisma.transaction.count.mockResolvedValue(1);
    mockPrisma.transaction.findMany.mockResolvedValue([mockTransaction]);

    const result = await TransactionService.getVendorTransactions('user-1', {
      page: 1,
      limit: 20,
      sort: 'newest',
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
  });
});

// ─── confirmPayment ─────────────────────────────────────────────────────────

describe('TransactionService.confirmPayment', () => {
  it('confirms payment and deducts stock', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    mock$transaction.mockImplementation(
      (cb: (tx: any) => any) => cb(mockTx({
        transaction: {
          findUnique: vi.fn().mockResolvedValue(mockTransaction),
          update: vi.fn().mockResolvedValue({
            ...mockTransaction,
            status: 'CONFIRMED',
            payment_status: 'PAID',
          }),
        },
        product: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'prod-1',
            name: 'Widget',
            track_inventory: true,
            stock_quantity: 10,
            low_stock_threshold: null,
            vendor_id: 'vendor-1',
          }),
          update: vi.fn(),
        },
        transactionItem: {
          update: vi.fn(),
        },
      })),
    );

    const result = await TransactionService.confirmPayment('tx-1', 'user-1');

    expect(result.status).toBe('CONFIRMED');
    expect(result.payment_status).toBe('PAID');
  });

  it('throws 400 when insufficient stock', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
    mock$transaction.mockImplementation(
      (cb: (tx: any) => any) => cb(mockTx({
        transaction: {
          findUnique: vi.fn().mockResolvedValue(mockTransaction),
          update: vi.fn(),
        },
        product: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'prod-1',
            name: 'Widget',
            track_inventory: true,
            stock_quantity: 1,
            vendor_id: 'vendor-1',
          }),
          update: vi.fn(),
        },
        transactionItem: { update: vi.fn() },
      })),
    );

    await expect(
      TransactionService.confirmPayment('tx-1', 'user-1'),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
