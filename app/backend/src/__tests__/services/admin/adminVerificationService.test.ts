import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@config/prisma.js', () => ({
  prisma: {
    vendorVerification: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    adminActivityLog: { create: vi.fn() },
  },
}));

vi.mock('@services/tierCalculationService.js', () => ({
  TierCalculationService: {
    calculateAndUpdateTier: vi.fn(() => Promise.resolve('TIER_1')),
  },
}));

import { AdminVerificationService } from '@services/admin/adminVerificationService.js';
import { prisma } from '@config/prisma.js';
import { TierCalculationService } from '@services/tierCalculationService.js';

const mockPrisma = prisma as any;
const mockTierCalc = TierCalculationService as any;

beforeEach(() => {
  vi.resetAllMocks();
  mockTierCalc.calculateAndUpdateTier.mockResolvedValue('TIER_1');
});

const pendingVerification = {
  id: 'verif-1',
  vendor_id: 'vendor-1',
  type: 'NIN',
  status: 'PENDING',
  points_value: 10,
};

const approvedVendorResult = {
  ...pendingVerification,
  status: 'APPROVED',
  reviewed_by: 'admin-1',
  reviewed_at: new Date(),
  approved_at: new Date(),
  admin_notes: null,
  vendor: { user: { email: 'vendor@test.com' } },
};

// ============================================
// approveVerification
// ============================================

describe('AdminVerificationService.approveVerification', () => {
  it('approves a pending verification and returns verification + new tier', async () => {
    mockPrisma.vendorVerification.findUnique.mockResolvedValue(pendingVerification);
    mockPrisma.vendorVerification.update.mockResolvedValue(approvedVendorResult);
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    const result = await AdminVerificationService.approveVerification(
      'verif-1',
      'admin-1',
      { admin_notes: 'Looks good' }
    );

    expect(result.verification.status).toBe('APPROVED');
    expect(result.new_tier).toBe('TIER_1');
    expect(mockTierCalc.calculateAndUpdateTier).toHaveBeenCalledWith('vendor-1');
  });

  it('throws 404 when verification is not found', async () => {
    mockPrisma.vendorVerification.findUnique.mockResolvedValue(null);

    await expect(
      AdminVerificationService.approveVerification('missing', 'admin-1', {})
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when verification is already APPROVED', async () => {
    mockPrisma.vendorVerification.findUnique.mockResolvedValue({
      ...pendingVerification,
      status: 'APPROVED',
    });

    await expect(
      AdminVerificationService.approveVerification('verif-1', 'admin-1', {})
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when verification is REJECTED', async () => {
    mockPrisma.vendorVerification.findUnique.mockResolvedValue({
      ...pendingVerification,
      status: 'REJECTED',
    });

    await expect(
      AdminVerificationService.approveVerification('verif-1', 'admin-1', {})
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('logs the admin action after approval', async () => {
    mockPrisma.vendorVerification.findUnique.mockResolvedValue(pendingVerification);
    mockPrisma.vendorVerification.update.mockResolvedValue(approvedVendorResult);
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    await AdminVerificationService.approveVerification('verif-1', 'admin-1', {});

    expect(mockPrisma.adminActivityLog.create).toHaveBeenCalledOnce();
    expect(mockPrisma.adminActivityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          admin_id: 'admin-1',
          action_type: 'verification_approved',
          target_id: 'verif-1',
        }),
      })
    );
  });
});

// ============================================
// rejectVerification
// ============================================

describe('AdminVerificationService.rejectVerification', () => {
  const rejectedResult = {
    ...pendingVerification,
    status: 'REJECTED',
    reviewed_by: 'admin-1',
    rejection_reason: 'Document unclear',
    vendor: { user: { email: 'vendor@test.com' } },
  };

  it('rejects a pending verification and returns the rejected record', async () => {
    mockPrisma.vendorVerification.findUnique.mockResolvedValue(pendingVerification);
    mockPrisma.vendorVerification.update.mockResolvedValue(rejectedResult);
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    const result = await AdminVerificationService.rejectVerification(
      'verif-1',
      'admin-1',
      { rejection_reason: 'Document unclear' }
    );

    expect(result.status).toBe('REJECTED');
    expect(mockPrisma.vendorVerification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'REJECTED',
          rejection_reason: 'Document unclear',
        }),
      })
    );
  });

  it('throws 404 when verification is not found', async () => {
    mockPrisma.vendorVerification.findUnique.mockResolvedValue(null);

    await expect(
      AdminVerificationService.rejectVerification('missing', 'admin-1', {
        rejection_reason: 'Bad doc',
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when verification is already APPROVED', async () => {
    mockPrisma.vendorVerification.findUnique.mockResolvedValue({
      ...pendingVerification,
      status: 'APPROVED',
    });

    await expect(
      AdminVerificationService.rejectVerification('verif-1', 'admin-1', {
        rejection_reason: 'Changed mind',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when verification is already REJECTED', async () => {
    mockPrisma.vendorVerification.findUnique.mockResolvedValue({
      ...pendingVerification,
      status: 'REJECTED',
    });

    await expect(
      AdminVerificationService.rejectVerification('verif-1', 'admin-1', {
        rejection_reason: 'Duplicate reject',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('logs the admin action after rejection', async () => {
    mockPrisma.vendorVerification.findUnique.mockResolvedValue(pendingVerification);
    mockPrisma.vendorVerification.update.mockResolvedValue(rejectedResult);
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    await AdminVerificationService.rejectVerification('verif-1', 'admin-1', {
      rejection_reason: 'Document unclear',
    });

    expect(mockPrisma.adminActivityLog.create).toHaveBeenCalledOnce();
    expect(mockPrisma.adminActivityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action_type: 'verification_rejected',
          target_id: 'verif-1',
        }),
      })
    );
  });
});

// ============================================
// getAllVerifications
// ============================================

describe('AdminVerificationService.getAllVerifications', () => {
  it('returns verifications and pagination', async () => {
    mockPrisma.vendorVerification.findMany.mockResolvedValue([pendingVerification]);
    mockPrisma.vendorVerification.count.mockResolvedValue(1);

    const result = await AdminVerificationService.getAllVerifications({});

    expect(result.verifications).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('applies status and type filters', async () => {
    mockPrisma.vendorVerification.findMany.mockResolvedValue([]);
    mockPrisma.vendorVerification.count.mockResolvedValue(0);

    await AdminVerificationService.getAllVerifications({ status: 'PENDING' as any, type: 'NIN' as any });

    expect(mockPrisma.vendorVerification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PENDING', type: 'NIN' }),
      })
    );
  });

  it('sorts PENDING verifications oldest-first', async () => {
    mockPrisma.vendorVerification.findMany.mockResolvedValue([]);
    mockPrisma.vendorVerification.count.mockResolvedValue(0);

    await AdminVerificationService.getAllVerifications({ status: 'PENDING' as any });

    expect(mockPrisma.vendorVerification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { submitted_at: 'asc' } })
    );
  });

  it('propagates errors from prisma', async () => {
    mockPrisma.vendorVerification.findMany.mockRejectedValue(new Error('DB error'));

    await expect(AdminVerificationService.getAllVerifications({})).rejects.toThrow('DB error');
  });
});

// ============================================
// getVerificationStats
// ============================================

describe('AdminVerificationService.getVerificationStats', () => {
  it('returns summary counts, pending_by_type, and recent_approvals', async () => {
    mockPrisma.vendorVerification.count
      .mockResolvedValueOnce(5)   // totalPending
      .mockResolvedValueOnce(20)  // totalApproved
      .mockResolvedValueOnce(3);  // totalRejected

    mockPrisma.vendorVerification.groupBy.mockResolvedValue([
      { type: 'NIN', _count: 3 },
      { type: 'ADDRESS', _count: 2 },
    ]);

    mockPrisma.vendorVerification.findMany.mockResolvedValue([
      { ...pendingVerification, status: 'APPROVED', vendor: { user: { email: 'v@test.com' } } },
    ]);

    const result = await AdminVerificationService.getVerificationStats();

    expect(result.summary.total_pending).toBe(5);
    expect(result.summary.total_approved).toBe(20);
    expect(result.summary.total_rejected).toBe(3);
    expect(result.pending_by_type).toHaveLength(2);
    expect(result.pending_by_type[0]).toEqual({ type: 'NIN', count: 3 });
    expect(result.recent_approvals).toHaveLength(1);
  });

  it('propagates errors from prisma', async () => {
    mockPrisma.vendorVerification.count.mockRejectedValue(new Error('DB error'));

    await expect(AdminVerificationService.getVerificationStats()).rejects.toThrow('DB error');
  });
});

// ============================================
// getVerificationDetails
// ============================================

describe('AdminVerificationService.getVerificationDetails', () => {
  it('returns verification details when found', async () => {
    const details = {
      ...pendingVerification,
      vendor: { user: { id: 'user-1', email: 'v@test.com', created_at: new Date() }, verifications: [] },
    };
    mockPrisma.vendorVerification.findUnique.mockResolvedValue(details);

    const result = await AdminVerificationService.getVerificationDetails('verif-1');

    expect(result.id).toBe('verif-1');
  });

  it('throws 404 when verification is not found', async () => {
    mockPrisma.vendorVerification.findUnique.mockResolvedValue(null);

    await expect(
      AdminVerificationService.getVerificationDetails('missing')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
