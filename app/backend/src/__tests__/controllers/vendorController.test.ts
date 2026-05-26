import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@services/vendorProfileService.js', () => ({
  VendorProfileService: {
    getVendorProfileWithVerifications: vi.fn(),
    getProfileCompletenessBreakdown: vi.fn(),
    updatePersonalInfo: vi.fn(),
    updateBusinessInfo: vi.fn(),
  },
}));

import { VendorProfileController } from '@controllers/vendorController.js';
import { VendorProfileService } from '@services/vendorProfileService.js';

const mockService = VendorProfileService as any;

beforeEach(() => {
  vi.resetAllMocks();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockReq(opts: { body?: Record<string, unknown>; userId?: string } = {}) {
  return {
    user: { userId: opts.userId ?? 'user-1' },
    body: opts.body ?? {},
  } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

/** Date string for someone `yearsAgo` years old today. */
function dobYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split('T')[0];
}

const validPersonalBody = {
  first_name: 'Ada',
  last_name: 'Lovelace',
  gender: 'FEMALE',
  date_of_birth: dobYearsAgo(25),
  phone_number: '+2348012345678',
};

const validBusinessBody = {
  business_name: 'Ada Crafts',
  business_description:
    'We sell high-quality handmade crafts, accessories, and personalised gifts for everyday use.',
  state: 'Lagos',
  city: 'Victoria Island',
  street_address: '12 Adeola Odeku Street',
  primary_category: 'Fashion',
  subcategories: ['Accessories'],
  bank_name: 'GTBank',
  account_number: '0123456789',
  account_name: 'Ada Lovelace',
  payment_models: ['FULL_PAYMENT'],
  refund_policy_type: 'NO_REFUNDS',
};

const baseProfile = {
  id: 'vendor-1',
  user_id: 'user-1',
  first_name: 'Ada',
  last_name: 'Lovelace',
  profile_completeness: 20,
  verifications: [],
};

const completenessBreakdown = {
  total_completeness: 20,
  sections: {
    personal_info: { completed: true, percentage: 20 },
    business_info: { completed: false, percentage: 0 },
    nin_verification: { completed: false, percentage: 0 },
    address_verification: { completed: false, percentage: 0 },
    business_verification: { completed: false, percentage: 0 },
  },
};

// ============================================
// getVendorProfile
// ============================================

describe('VendorProfileController.getVendorProfile', () => {
  it('returns 200 with profile data when profile exists', async () => {
    mockService.getVendorProfileWithVerifications.mockResolvedValue(baseProfile);

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await VendorProfileController.getVendorProfile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: baseProfile });
    expect(next).not.toHaveBeenCalled();
  });

  it('passes 404 AppError to next when profile does not exist', async () => {
    mockService.getVendorProfileWithVerifications.mockResolvedValue(null);

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await VendorProfileController.getVendorProfile(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    expect(res.json).not.toHaveBeenCalled();
  });

  it('calls service with the authenticated user ID', async () => {
    mockService.getVendorProfileWithVerifications.mockResolvedValue(baseProfile);

    const req = mockReq({ userId: 'user-abc' });
    const res = mockRes();
    const next = vi.fn();

    await VendorProfileController.getVendorProfile(req, res, next);

    expect(mockService.getVendorProfileWithVerifications).toHaveBeenCalledWith('user-abc');
  });
});

// ============================================
// getProfileCompleteness
// ============================================

describe('VendorProfileController.getProfileCompleteness', () => {
  it('returns 200 with completeness breakdown', async () => {
    mockService.getProfileCompletenessBreakdown.mockResolvedValue(completenessBreakdown);

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await VendorProfileController.getProfileCompleteness(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: completenessBreakdown });
    expect(next).not.toHaveBeenCalled();
  });

  it('passes service errors to next()', async () => {
    mockService.getProfileCompletenessBreakdown.mockRejectedValue(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await VendorProfileController.getProfileCompleteness(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).not.toHaveBeenCalled();
  });
});

// ============================================
// updatePersonalInfo
// ============================================

describe('VendorProfileController.updatePersonalInfo', () => {
  it('returns 200 with updated profile on valid input', async () => {
    const updatedProfile = { ...baseProfile, phone_number: '+2348012345678' };
    mockService.updatePersonalInfo.mockResolvedValue(updatedProfile);

    const req = mockReq({ body: validPersonalBody });
    const res = mockRes();
    const next = vi.fn();

    await VendorProfileController.updatePersonalInfo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: updatedProfile,
        message: 'Personal information updated successfully',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls service with authenticated userId', async () => {
    mockService.updatePersonalInfo.mockResolvedValue(baseProfile);

    const req = mockReq({ body: validPersonalBody, userId: 'user-xyz' });
    const res = mockRes();
    const next = vi.fn();

    await VendorProfileController.updatePersonalInfo(req, res, next);

    expect(mockService.updatePersonalInfo).toHaveBeenCalledWith('user-xyz', expect.any(Object));
  });

  it('rejects with 400 and does not call service when body fails validation', async () => {
    const req = mockReq({ body: {} }); // missing all required fields
    const res = mockRes();
    const next = vi.fn();

    await expect(
      VendorProfileController.updatePersonalInfo(req, res, next)
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockService.updatePersonalInfo).not.toHaveBeenCalled();
  });

  it('passes AppError to next when service throws (e.g. age < 16)', async () => {
    mockService.updatePersonalInfo.mockRejectedValue({ statusCode: 400, message: 'Must be 16+' });

    const req = mockReq({ body: validPersonalBody });
    const res = mockRes();
    const next = vi.fn();

    await VendorProfileController.updatePersonalInfo(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(res.json).not.toHaveBeenCalled();
  });
});

// ============================================
// updateBusinessInfo
// ============================================

describe('VendorProfileController.updateBusinessInfo', () => {
  it('returns 200 with updated profile on valid input', async () => {
    const updatedProfile = { ...baseProfile, business_name: 'Ada Crafts', slug: 'ada-crafts' };
    mockService.updateBusinessInfo.mockResolvedValue(updatedProfile);

    const req = mockReq({ body: validBusinessBody });
    const res = mockRes();
    const next = vi.fn();

    await VendorProfileController.updateBusinessInfo(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: updatedProfile,
        message: 'Business information updated successfully',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls service with authenticated userId', async () => {
    mockService.updateBusinessInfo.mockResolvedValue(baseProfile);

    const req = mockReq({ body: validBusinessBody, userId: 'user-xyz' });
    const res = mockRes();
    const next = vi.fn();

    await VendorProfileController.updateBusinessInfo(req, res, next);

    expect(mockService.updateBusinessInfo).toHaveBeenCalledWith('user-xyz', expect.any(Object));
  });

  it('rejects with 400 and does not call service when body fails validation', async () => {
    const req = mockReq({ body: { business_name: 'X' } }); // too short + missing fields
    const res = mockRes();
    const next = vi.fn();

    await expect(
      VendorProfileController.updateBusinessInfo(req, res, next)
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockService.updateBusinessInfo).not.toHaveBeenCalled();
  });

  it('passes 400 AppError to next when personal info is not yet complete', async () => {
    mockService.updateBusinessInfo.mockRejectedValue({
      statusCode: 400,
      message: 'Please complete personal information first',
    });

    const req = mockReq({ body: validBusinessBody });
    const res = mockRes();
    const next = vi.fn();

    await VendorProfileController.updateBusinessInfo(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: expect.stringContaining('personal') })
    );
  });

  it('passes generic service errors to next()', async () => {
    mockService.updateBusinessInfo.mockRejectedValue(new Error('Unexpected DB error'));

    const req = mockReq({ body: validBusinessBody });
    const res = mockRes();
    const next = vi.fn();

    await VendorProfileController.updateBusinessInfo(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.json).not.toHaveBeenCalled();
  });
});
