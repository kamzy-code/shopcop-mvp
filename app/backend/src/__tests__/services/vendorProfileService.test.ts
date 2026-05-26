import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@config/prisma.js', () => ({
  prisma: {
    vendorProfile: {
      upsert: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { VendorProfileService } from '@services/vendorProfileService.js';
import { prisma } from '@config/prisma.js';

const mockPrisma = prisma as any;

beforeEach(() => {
  vi.resetAllMocks();
});

// Returns a Date for someone who is `yearsAgo` years old today
function dobYearsAgo(yearsAgo: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yearsAgo);
  return d;
}

const personalData = {
  first_name: 'Ada',
  last_name: 'Lovelace',
  gender: 'FEMALE' as any,
  date_of_birth: dobYearsAgo(25),
  phone_number: '+2348012345678',
};

const baseProfile = {
  id: 'vendor-1',
  user_id: 'user-1',
  personal_info_complete: true,
  business_info_complete: false,
  slug: null,
  verifications: [],
};

// ============================================
// updatePersonalInfo
// ============================================

describe('VendorProfileService.updatePersonalInfo', () => {
  it('creates or updates the vendor profile for a valid age', async () => {
    mockPrisma.vendorProfile.upsert.mockResolvedValue({ ...baseProfile, ...personalData });
    mockPrisma.vendorProfile.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);

    const result = await VendorProfileService.updatePersonalInfo('user-1', personalData);

    expect(mockPrisma.vendorProfile.upsert).toHaveBeenCalledOnce();
    expect(result.first_name).toBe('Ada');
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'Ada Lovelace' } })
    );
  });

  it('throws 400 when age is under 16', async () => {
    const underageData = { ...personalData, date_of_birth: dobYearsAgo(15) };

    await expect(
      VendorProfileService.updatePersonalInfo('user-1', underageData)
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockPrisma.vendorProfile.upsert).not.toHaveBeenCalled();
  });

  it('throws 400 for a 15-year-old on their birthday', async () => {
    const exactlyFifteen = dobYearsAgo(15);

    await expect(
      VendorProfileService.updatePersonalInfo('user-1', { ...personalData, date_of_birth: exactlyFifteen })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('allows a vendor who just turned 16', async () => {
    mockPrisma.vendorProfile.upsert.mockResolvedValue({ ...baseProfile, ...personalData });
    mockPrisma.vendorProfile.update.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);

    const exactlySixteen = dobYearsAgo(16);
    await expect(
      VendorProfileService.updatePersonalInfo('user-1', { ...personalData, date_of_birth: exactlySixteen })
    ).resolves.toBeDefined();
  });
});

// ============================================
// updateBusinessInfo
// ============================================

describe('VendorProfileService.updateBusinessInfo', () => {
  const businessData = {
    business_name: 'Ada Crafts',
    business_description: 'Handmade goods',
    business_category: 'FASHION' as any,
    state: 'Lagos',
    city: 'Lagos Island',
    payment_models: ['ESCROW'] as any,
    bank_name: 'GTB',
    account_number: '0123456789',
    account_name: 'Ada Lovelace',
  };

  it('throws 400 when vendor profile (personal info) does not exist', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(null);

    await expect(
      VendorProfileService.updateBusinessInfo('user-1', businessData as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('generates a slug and updates business info', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue({ ...baseProfile });
    mockPrisma.vendorProfile.findFirst.mockResolvedValue(null); // slug is unique
    mockPrisma.vendorProfile.update
      .mockResolvedValueOnce({ ...baseProfile, ...businessData, slug: 'ada-crafts', verifications: [] })
      .mockResolvedValueOnce({}); // completeness update

    const result = await VendorProfileService.updateBusinessInfo('user-1', businessData as any);

    expect(result.slug).toBe('ada-crafts');
    expect(mockPrisma.vendorProfile.update).toHaveBeenCalledTimes(2);
  });

  it('appends a numeric suffix when base slug is already taken', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue({ ...baseProfile });
    // First findFirst (base slug) returns a collision, second (with suffix) returns null
    mockPrisma.vendorProfile.findFirst
      .mockResolvedValueOnce({ id: 'other-vendor', slug: 'ada-crafts' })
      .mockResolvedValue(null);
    mockPrisma.vendorProfile.update
      .mockResolvedValueOnce({ ...baseProfile, ...businessData, slug: 'ada-crafts-1234', verifications: [] })
      .mockResolvedValueOnce({});

    const result = await VendorProfileService.updateBusinessInfo('user-1', businessData as any);

    // slug should NOT equal the plain base slug
    expect(result.slug).not.toBe('ada-crafts');
    expect(result.slug).toMatch(/^ada-crafts-\d{4}$/);
  });
});

// ============================================
// getVendorProfile
// ============================================

describe('VendorProfileService.getVendorProfile', () => {
  it('returns null when profile does not exist', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(null);

    const result = await VendorProfileService.getVendorProfile('user-99');

    expect(result).toBeNull();
  });

  it('returns the vendor profile when it exists', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(baseProfile);

    const result = await VendorProfileService.getVendorProfile('user-1');

    expect(result?.id).toBe('vendor-1');
  });
});

// ============================================
// getVendorProfileWithVerifications
// ============================================

describe('VendorProfileService.getVendorProfileWithVerifications', () => {
  it('returns null when profile does not exist', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(null);

    const result = await VendorProfileService.getVendorProfileWithVerifications('user-99');

    expect(result).toBeNull();
  });

  it('returns profile with verifications and calculated completeness', async () => {
    const profileWithVerifications = {
      ...baseProfile,
      personal_info_complete: true,
      business_info_complete: true,
      verifications: [],
      user: { id: 'user-1', email: 'ada@test.com', role: 'VENDOR' },
    };
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(profileWithVerifications);

    const result = await VendorProfileService.getVendorProfileWithVerifications('user-1');

    expect(result?.id).toBe('vendor-1');
    expect(result?.verifications).toBeDefined();
    expect(typeof result?.profile_completeness).toBe('number');
  });
});

// ============================================
// getProfileCompletenessBreakdown
// ============================================

describe('VendorProfileService.getProfileCompletenessBreakdown', () => {
  it('returns all-zero breakdown when profile does not exist', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue(null);

    const result = await VendorProfileService.getProfileCompletenessBreakdown('user-99');

    expect(result.total_completeness).toBe(0);
    expect(result.sections.personal_info.completed).toBe(false);
    expect(result.sections.personal_info.percentage).toBe(0);
    expect(result.sections.business_info.completed).toBe(false);
    expect(result.sections.nin_verification.completed).toBe(false);
    expect(result.sections.address_verification.completed).toBe(false);
    expect(result.sections.business_verification.completed).toBe(false);
  });

  it('returns correct section completion for a fully-onboarded vendor', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue({
      ...baseProfile,
      personal_info_complete: true,
      business_info_complete: true,
      verifications: [
        { type: 'NIN', status: 'APPROVED' },
        { type: 'ADDRESS', status: 'APPROVED' },
        { type: 'CAC', status: 'APPROVED' },
      ],
    });

    const result = await VendorProfileService.getProfileCompletenessBreakdown('user-1');

    expect(result.sections.personal_info.completed).toBe(true);
    expect(result.sections.personal_info.percentage).toBe(20);
    expect(result.sections.business_info.completed).toBe(true);
    expect(result.sections.nin_verification.completed).toBe(true);
    expect(result.sections.address_verification.completed).toBe(true);
    expect(result.sections.business_verification.completed).toBe(true);
  });

  it('counts SMEDAN as business_verification (same as CAC)', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue({
      ...baseProfile,
      personal_info_complete: false,
      business_info_complete: false,
      verifications: [
        { type: 'SMEDAN', status: 'APPROVED' },
      ],
    });

    const result = await VendorProfileService.getProfileCompletenessBreakdown('user-1');

    expect(result.sections.business_verification.completed).toBe(true);
    expect(result.sections.nin_verification.completed).toBe(false);
  });

  it('pending verifications do not count toward completion', async () => {
    mockPrisma.vendorProfile.findUnique.mockResolvedValue({
      ...baseProfile,
      personal_info_complete: true,
      business_info_complete: false,
      verifications: [
        { type: 'NIN', status: 'PENDING' },
      ],
    });

    const result = await VendorProfileService.getProfileCompletenessBreakdown('user-1');

    expect(result.sections.nin_verification.completed).toBe(false);
    expect(result.sections.nin_verification.percentage).toBe(0);
  });
});
