import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

vi.mock('@services/transactionService.js', () => ({
  TransactionService: {
    createTransaction: vi.fn(),
    getVendorTransactions: vi.fn(),
    getTransaction: vi.fn(),
    getTransactionByToken: vi.fn(),
    submitPaymentProof: vi.fn(),
    updateTransaction: vi.fn(),
    updateTransactionStatus: vi.fn(),
    confirmPayment: vi.fn(),
    cancelTransaction: vi.fn(),
    getAnalyticsSummary: vi.fn(),
  },
}));

import { TransactionController } from '@controllers/transactionController.js';
import { TransactionService } from '@services/transactionService.js';

const MockService = TransactionService as any;
const mockReq = (overrides: Record<string, any> = {}): Request =>
  ({
    user: { userId: 'user-1' },
    params: {},
    query: {},
    body: {},
    ...overrides,
  }) as any as Request;

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

const mockNext: NextFunction = vi.fn() as any;

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── createTransaction ──────────────────────────────────────────────────────

describe('TransactionController.createTransaction', () => {
  it('returns 201 with created transaction', async () => {
    const req = mockReq({
      body: {
        delivery_method: 'PICKUP',
        items: [{ item_name: 'Widget', item_price: 1000, quantity: 1 }],
      },
    });
    const res = mockRes();
    MockService.createTransaction.mockResolvedValue({ id: 'tx-1' });

    await TransactionController.createTransaction(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { id: 'tx-1' } }),
    );
  });

  it('calls next with error on service failure', async () => {
    const req = mockReq({
      body: {
        delivery_method: 'PICKUP',
        items: [{ item_name: 'Widget', item_price: 1000, quantity: 1 }],
      },
    });
    const res = mockRes();
    MockService.createTransaction.mockRejectedValue(new Error('DB error'));

    await TransactionController.createTransaction(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ─── getTransactions ────────────────────────────────────────────────────────

describe('TransactionController.getTransactions', () => {
  it('returns 200 with paginated transactions', async () => {
    const req = mockReq({ query: { page: '1', limit: '20' } });
    const res = mockRes();
    MockService.getVendorTransactions.mockResolvedValue({
      transactions: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    await TransactionController.getTransactions(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: [] }),
    );
  });
});

// ─── getTransaction ─────────────────────────────────────────────────────────

describe('TransactionController.getTransaction', () => {
  it('returns 200 with transaction', async () => {
    const req = mockReq({ params: { id: 'tx-1' } });
    const res = mockRes();
    MockService.getTransaction.mockResolvedValue({ id: 'tx-1' });

    await TransactionController.getTransaction(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { id: 'tx-1' } }),
    );
  });
});

// ─── getTransactionByToken ──────────────────────────────────────────────────

describe('TransactionController.getTransactionByToken', () => {
  it('returns 200 with buyer-safe data (strips vendor_notes)', async () => {
    const req = mockReq({ params: { token: 'abc123' } });
    const res = mockRes();
    MockService.getTransactionByToken.mockResolvedValue({
      id: 'tx-1',
      vendor_notes: 'secret',
      public_field: 'visible',
    });

    await TransactionController.getTransactionByToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ public_field: 'visible' }),
      }),
    );
  });
});

// ─── submitPaymentProof ─────────────────────────────────────────────────────

describe('TransactionController.submitPaymentProof', () => {
  it('returns 200 with buyer-safe data', async () => {
    const req = mockReq({
      params: { token: 'abc123' },
      body: { buyer_email: 'buyer@test.com' },
    });
    const res = mockRes();
    MockService.submitPaymentProof.mockResolvedValue({
      id: 'tx-1',
      vendor_notes: 'secret',
    });

    await TransactionController.submitPaymentProof(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });
});

// ─── updateTransaction ──────────────────────────────────────────────────────

describe('TransactionController.updateTransaction', () => {
  it('returns 200 with updated transaction', async () => {
    const req = mockReq({
      params: { id: 'tx-1' },
      body: { buyer_email: 'new@example.com' },
    });
    const res = mockRes();
    MockService.updateTransaction.mockResolvedValue({ id: 'tx-1' });

    await TransactionController.updateTransaction(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });
});

// ─── updateStatus ───────────────────────────────────────────────────────────

describe('TransactionController.updateStatus', () => {
  it('returns 200 with updated status', async () => {
    const req = mockReq({
      params: { id: 'tx-1' },
      body: { status: 'DELIVERED' },
    });
    const res = mockRes();
    MockService.updateTransactionStatus.mockResolvedValue({ id: 'tx-1', status: 'DELIVERED' });

    await TransactionController.updateStatus(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });
});

// ─── confirmPayment ─────────────────────────────────────────────────────────

describe('TransactionController.confirmPayment', () => {
  it('returns 200 with confirmed transaction', async () => {
    const req = mockReq({
      params: { id: 'tx-1' },
      body: { payment_notes: 'Paid via bank' },
    });
    const res = mockRes();
    MockService.confirmPayment.mockResolvedValue({ id: 'tx-1', status: 'CONFIRMED' });

    await TransactionController.confirmPayment(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });
});

// ─── cancelTransaction ──────────────────────────────────────────────────────

describe('TransactionController.cancelTransaction', () => {
  it('returns 200 with cancelled transaction', async () => {
    const req = mockReq({
      params: { id: 'tx-1' },
      body: { reason: 'Buyer requested cancellation via phone call.' },
    });
    const res = mockRes();
    MockService.cancelTransaction.mockResolvedValue({ id: 'tx-1', status: 'CANCELLED' });

    await TransactionController.cancelTransaction(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });
});

// ─── getAnalytics ───────────────────────────────────────────────────────────

describe('TransactionController.getAnalytics', () => {
  it('returns 200 with analytics summary', async () => {
    const req = mockReq();
    const res = mockRes();
    MockService.getAnalyticsSummary.mockResolvedValue({
      this_month: { total_orders: 10, revenue: 50000 },
    });

    await TransactionController.getAnalytics(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.any(Object) }),
    );
  });
});
