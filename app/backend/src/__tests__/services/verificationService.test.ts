import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@config/prisma.js', () => ({
  prisma: {
    vendorProfile: { findUnique: vi.fn() },
    vendorVerification: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { VerificationService } from '@services/verificationService.js';
import { prisma } from '@config/prisma.js';

const mockPrisma = prisma as any;

beforeEach(() => {
  vi.resetAllMocks();
});

const completePersonalProfile = {
  id: 'vendor-1',
  user_id: 'user-1',
  personal_info_complete: true,
  business_info_complete: true,
  street_address: '12 Lagos St',
};

const baseVerification = {
  id: 'verif-1',
  vendor_id: 'vendor-1',
  type: 'NIN',
  status: 'PENDING',
  points_value: 10,
};

const ninData = {
  nin_number: '12345678901',
  full_name: 'Ada Lovelace',
  nin_doc_url: 'https://cdn.example.com/nin.jpg',
  nin_doc_public_id: 'uploads/nin',
};

// ============================================
// submitNINVerification
// ============================================

describe('VerificationService.submitNINVerification', () => {
  it('creates and returns a NIN verification', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(completePersonalProfile);
    mockPrisma.vendorVerification.findFirst.mockResolvedValue(null);
    mockPrisma.vendorVerification.create.mockResolvedValue({ ...baseVerification, ...ninData });

    const result = await VerificationService.submitNINVerification('vendor-1', ninData as any);

    expect(result.type).toBe('NIN');
    expect(mockPrisma.vendorVerification.create).toHaveBeenCalledOnce();
  });

  it('throws 404 when vendor profile is not found', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(null);

    await expect(
      VerificationService.submitNINVerification('missing-vendor', ninData as any)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when personal info is not complete', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue({
      ...completePersonalProfile,
      personal_info_complete: false,
    });

    await expect(
      VerificationService.submitNINVerification('vendor-1', ninData as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 409 when NIN verification is already pending', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(completePersonalProfile);
    mockPrisma.vendorVerification.findFirst.mockResolvedValue({
      ...baseVerification,
      status: 'PENDING',
    });

    await expect(
      VerificationService.submitNINVerification('vendor-1', ninData as any)
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 409 when NIN verification is already approved', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(completePersonalProfile);
    mockPrisma.vendorVerification.findFirst.mockResolvedValue({
      ...baseVerification,
      status: 'APPROVED',
    });

    await expect(
      VerificationService.submitNINVerification('vendor-1', ninData as any)
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ============================================
// submitCACVerification
// ============================================

describe('VerificationService.submitCACVerification', () => {
  const cacData = {
    rc_number: 'RC123456',
    company_type: 'LLC',
    cac_doc_url: 'https://cdn.example.com/cac.pdf',
    cac_doc_public_id: 'uploads/cac',
  };

  it('throws 404 when vendor profile is not found', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(null);

    await expect(
      VerificationService.submitCACVerification('missing', cacData as any)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when business info is not complete', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue({
      ...completePersonalProfile,
      business_info_complete: false,
    });

    await expect(
      VerificationService.submitCACVerification('vendor-1', cacData as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 409 when CAC verification already pending', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(completePersonalProfile);
    mockPrisma.vendorVerification.findFirst.mockResolvedValue({
      ...baseVerification,
      type: 'CAC',
      status: 'PENDING',
    });

    await expect(
      VerificationService.submitCACVerification('vendor-1', cacData as any)
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ============================================
// submitAddressVerification
// ============================================

describe('VerificationService.submitAddressVerification', () => {
  const addressData = {
    address_doc_url: 'https://cdn.example.com/addr.pdf',
    address_doc_public_id: 'uploads/addr',
  };

  it('throws 400 when street_address is missing', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue({
      ...completePersonalProfile,
      street_address: null,
    });

    await expect(
      VerificationService.submitAddressVerification('vendor-1', addressData as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ============================================
// submitSMEDANVerification
// ============================================

describe('VerificationService.submitSMEDANVerification', () => {
  const smedanData = {
    smedan_suin: 'SUIN-12345',
    smedan_business_type: 'SOLE_PROPRIETOR',
    smedan_certificate_url: 'https://cdn.example.com/smedan.pdf',
    smedan_certificate_public_id: 'uploads/smedan',
  };

  it('creates and returns a SMEDAN verification', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(completePersonalProfile);
    mockPrisma.vendorVerification.findFirst.mockResolvedValue(null);
    mockPrisma.vendorVerification.create.mockResolvedValue({
      ...baseVerification,
      type: 'SMEDAN',
      ...smedanData,
    });

    const result = await VerificationService.submitSMEDANVerification('vendor-1', smedanData as any);

    expect(result.type).toBe('SMEDAN');
    expect(mockPrisma.vendorVerification.create).toHaveBeenCalledOnce();
  });

  it('throws 404 when vendor profile is not found', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(null);

    await expect(
      VerificationService.submitSMEDANVerification('missing', smedanData as any)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when business info is not complete', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue({
      ...completePersonalProfile,
      business_info_complete: false,
    });

    await expect(
      VerificationService.submitSMEDANVerification('vendor-1', smedanData as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 409 when SMEDAN verification is already pending', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(completePersonalProfile);
    mockPrisma.vendorVerification.findFirst.mockResolvedValue({
      ...baseVerification,
      type: 'SMEDAN',
      status: 'PENDING',
    });

    await expect(
      VerificationService.submitSMEDANVerification('vendor-1', smedanData as any)
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 409 when SMEDAN verification is already approved', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(completePersonalProfile);
    mockPrisma.vendorVerification.findFirst.mockResolvedValue({
      ...baseVerification,
      type: 'SMEDAN',
      status: 'APPROVED',
    });

    await expect(
      VerificationService.submitSMEDANVerification('vendor-1', smedanData as any)
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ============================================
// getVerificationById
// ============================================

describe('VerificationService.getVerificationById', () => {
  it('returns the verification when found', async () => {
    mockPrisma.vendorVerification.findUnique.mockResolvedValue({
      ...baseVerification,
      vendor: { user: { email: 'vendor@test.com' } },
    });

    const result = await VerificationService.getVerificationById('verif-1');

    expect(result?.id).toBe('verif-1');
    expect(mockPrisma.vendorVerification.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'verif-1' } })
    );
  });

  it('returns null when not found', async () => {
    mockPrisma.vendorVerification.findUnique.mockResolvedValue(null);

    const result = await VerificationService.getVerificationById('missing');

    expect(result).toBeNull();
  });
});

// ============================================
// resubmitVerification
// ============================================

describe('VerificationService.resubmitVerification', () => {
  it('resubmits a rejected verification successfully', async () => {
    const rejected = { ...baseVerification, status: 'REJECTED' };
    const updated = { ...baseVerification, status: 'PENDING' };

    mockPrisma.vendorVerification.findFirst.mockResolvedValue(rejected);
    mockPrisma.vendorVerification.update.mockResolvedValue(updated);

    const result = await VerificationService.resubmitVerification('verif-1', 'vendor-1', ninData as any);

    expect(result.status).toBe('PENDING');
    expect(mockPrisma.vendorVerification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'verif-1' },
        data: expect.objectContaining({ status: 'PENDING', rejection_reason: null }),
      })
    );
  });

  it('throws 404 when verification not found', async () => {
    mockPrisma.vendorVerification.findFirst.mockResolvedValue(null);

    await expect(
      VerificationService.resubmitVerification('missing', 'vendor-1', {})
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when verification is not in REJECTED status (PENDING)', async () => {
    mockPrisma.vendorVerification.findFirst.mockResolvedValue({
      ...baseVerification,
      status: 'PENDING',
    });

    await expect(
      VerificationService.resubmitVerification('verif-1', 'vendor-1', {})
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when verification is not in REJECTED status (APPROVED)', async () => {
    mockPrisma.vendorVerification.findFirst.mockResolvedValue({
      ...baseVerification,
      status: 'APPROVED',
    });

    await expect(
      VerificationService.resubmitVerification('verif-1', 'vendor-1', {})
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ============================================
// getVendorVerifications
// ============================================

describe('VerificationService.getVendorVerifications', () => {
  it('returns verifications for a vendor', async () => {
    mockPrisma.vendorVerification.findMany.mockResolvedValue([baseVerification]);

    const result = await VerificationService.getVendorVerifications('vendor-1');

    expect(result).toHaveLength(1);
    expect(mockPrisma.vendorVerification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { vendor_id: 'vendor-1' } })
    );
  });
});
