import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@config/prisma.js', () => ({
  prisma: {
    adminProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    adminActivityLog: { create: vi.fn() },
  },
}));

import { AdminProfileService } from '@services/admin/adminProfileService.js';
import { prisma } from '@config/prisma.js';

const mockPrisma = prisma as any;

beforeEach(() => {
  vi.resetAllMocks();
});

const baseProfile = {
  id: 'profile-1',
  user_id: 'user-1',
  first_name: 'Ada',
  last_name: 'Lovelace',
  middle_name: null,
  phone_number: '+2348012345678',
  gender: null,
  date_of_birth: null,
  department: null,
  role_title: null,
  profile_complete: true,
  user: { email: 'ada@test.com', name: 'Ada Lovelace', avatar_url: null, role: 'ADMIN' },
};

// ============================================
// getProfile
// ============================================

describe('AdminProfileService.getProfile', () => {
  it('returns the admin profile when found', async () => {
    mockPrisma.adminProfile.findUnique.mockResolvedValue(baseProfile);

    const result = await AdminProfileService.getProfile('user-1');

    expect(result?.id).toBe('profile-1');
    expect(mockPrisma.adminProfile.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 'user-1' } })
    );
  });

  it('returns null when no profile exists yet', async () => {
    mockPrisma.adminProfile.findUnique.mockResolvedValue(null);

    const result = await AdminProfileService.getProfile('user-99');

    expect(result).toBeNull();
  });
});

// ============================================
// upsertProfile
// ============================================

describe('AdminProfileService.upsertProfile', () => {
  it('creates a new profile and sets profile_complete=true when all three required fields present', async () => {
    mockPrisma.adminProfile.findUnique.mockResolvedValue(null); // no existing profile
    mockPrisma.adminProfile.upsert.mockResolvedValue({ ...baseProfile, profile_complete: true });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    const result = await AdminProfileService.upsertProfile('user-1', {
      first_name: 'Ada',
      last_name: 'Lovelace',
      phone_number: '+2348012345678',
    });

    expect(result.profile_complete).toBe(true);
    expect(mockPrisma.adminProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ profile_complete: true }),
      })
    );
  });

  it('sets profile_complete=false when phone_number is missing', async () => {
    mockPrisma.adminProfile.findUnique.mockResolvedValue(null);
    mockPrisma.adminProfile.upsert.mockResolvedValue({ ...baseProfile, profile_complete: false });
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    await AdminProfileService.upsertProfile('user-1', {
      first_name: 'Ada',
      last_name: 'Lovelace',
    });

    expect(mockPrisma.adminProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ profile_complete: false }),
      })
    );
  });

  it('merges incoming partial data with existing stored values for completeness check', async () => {
    // existing profile has first+last but no phone
    mockPrisma.adminProfile.findUnique.mockResolvedValue({
      id: 'profile-1',
      first_name: 'Ada',
      last_name: 'Lovelace',
      phone_number: null,
    });
    mockPrisma.adminProfile.upsert.mockResolvedValue({ ...baseProfile, profile_complete: true });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    // only phone number supplied in this update
    await AdminProfileService.upsertProfile('user-1', {
      phone_number: '+2348012345678',
    });

    // merged: first=Ada, last=Lovelace, phone=+234... → complete
    expect(mockPrisma.adminProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ profile_complete: true }),
      })
    );
  });

  it('updates User.name when both first_name and last_name are resolved', async () => {
    mockPrisma.adminProfile.findUnique.mockResolvedValue(null);
    mockPrisma.adminProfile.upsert.mockResolvedValue(baseProfile);
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    await AdminProfileService.upsertProfile('user-1', {
      first_name: 'Ada',
      last_name: 'Lovelace',
    });

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'Ada Lovelace' } })
    );
  });

  it('does NOT update User.name when only one name field is available', async () => {
    mockPrisma.adminProfile.findUnique.mockResolvedValue(null); // no existing data
    mockPrisma.adminProfile.upsert.mockResolvedValue({ ...baseProfile, last_name: null, profile_complete: false });
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    // only first_name supplied, no last_name anywhere
    await AdminProfileService.upsertProfile('user-1', { first_name: 'Ada' });

    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('logs an admin action after the upsert', async () => {
    mockPrisma.adminProfile.findUnique.mockResolvedValue(null);
    mockPrisma.adminProfile.upsert.mockResolvedValue(baseProfile);
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    await AdminProfileService.upsertProfile('user-1', { first_name: 'Ada', last_name: 'Lovelace' });

    expect(mockPrisma.adminActivityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action_type: 'admin_profile_updated' }),
      })
    );
  });
});
