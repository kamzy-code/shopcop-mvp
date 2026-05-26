import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@config/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    adminActivityLog: { create: vi.fn() },
  },
}));

import { AdminUserService } from '@services/admin/adminUserService.js';
import { prisma } from '@config/prisma.js';

const mockPrisma = prisma as any;

beforeEach(() => {
  vi.resetAllMocks();
});

const baseUser = {
  id: 'user-1',
  email: 'ada@test.com',
  name: 'Ada Lovelace',
  avatar_url: null,
  role: 'VENDOR',
  is_active: true,
  email_verified: true,
  last_login_at: null,
  created_at: new Date(),
  updated_at: new Date(),
};

// ============================================
// getAllUsers
// ============================================

describe('AdminUserService.getAllUsers', () => {
  it('returns users and pagination with no filters', async () => {
    mockPrisma.user.findMany.mockResolvedValue([baseUser]);
    mockPrisma.user.count.mockResolvedValue(1);

    const result = await AdminUserService.getAllUsers({}, 'admin-1');

    expect(result.users).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('returns empty array and zero total when no users match', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(0);

    const result = await AdminUserService.getAllUsers({ role: 'BUYER' as any }, 'admin-1');

    expect(result.users).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });

  it('applies role filter to the query', async () => {
    mockPrisma.user.findMany.mockResolvedValue([baseUser]);
    mockPrisma.user.count.mockResolvedValue(1);

    await AdminUserService.getAllUsers({ role: 'VENDOR' as any }, 'admin-1');

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ role: 'VENDOR' }) })
    );
  });

  it('applies is_active filter to the query', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(0);

    await AdminUserService.getAllUsers({ is_active: false }, 'admin-1');

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ is_active: false }) })
    );
  });

  it('applies search filter as OR on email and name', async () => {
    mockPrisma.user.findMany.mockResolvedValue([baseUser]);
    mockPrisma.user.count.mockResolvedValue(1);

    await AdminUserService.getAllUsers({ search: 'ada' }, 'admin-1');

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { email: { contains: 'ada', mode: 'insensitive' } },
            { name: { contains: 'ada', mode: 'insensitive' } },
          ]),
        }),
      })
    );
  });

  it('uses provided page and limit for pagination', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(50);

    const result = await AdminUserService.getAllUsers({ page: 3, limit: 10 }, 'admin-1');

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
    expect(result.pagination.totalPages).toBe(5);
  });
});

// ============================================
// getUserWithProfile
// ============================================

describe('AdminUserService.getUserWithProfile', () => {
  it('returns user with vendor profile when found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      vendor_profile: { id: 'vp-1', business_name: 'Ada Crafts', current_tier: 'TIER_0' },
    });

    const result = await AdminUserService.getUserWithProfile('user-1', 'admin-1');

    expect(result.id).toBe('user-1');
    expect(result.vendor_profile).toBeDefined();
  });

  it('throws 404 when user is not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      AdminUserService.getUserWithProfile('missing', 'admin-1')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ============================================
// updateUserStatus
// ============================================

describe('AdminUserService.updateUserStatus', () => {
  it('activates a user and returns updated record', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, is_active: false });
    mockPrisma.user.update.mockResolvedValue({ ...baseUser, is_active: true });
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    const result = await AdminUserService.updateUserStatus('user-1', true, 'admin-1');

    expect(result.is_active).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { is_active: true } })
    );
  });

  it('deactivates a user and logs user_deactivated action', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, is_active: true });
    mockPrisma.user.update.mockResolvedValue({ ...baseUser, is_active: false });
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    await AdminUserService.updateUserStatus('user-1', false, 'admin-1');

    expect(mockPrisma.adminActivityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action_type: 'user_deactivated' }),
      })
    );
  });

  it('logs user_activated when activating', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, is_active: false });
    mockPrisma.user.update.mockResolvedValue({ ...baseUser, is_active: true });
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    await AdminUserService.updateUserStatus('user-1', true, 'admin-1');

    expect(mockPrisma.adminActivityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action_type: 'user_activated' }),
      })
    );
  });

  it('throws 404 when user is not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      AdminUserService.updateUserStatus('missing', true, 'admin-1')
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});

// ============================================
// updateUserRole
// ============================================

describe('AdminUserService.updateUserRole', () => {
  it('updates role and returns updated record', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, role: 'VENDOR' });
    mockPrisma.user.update.mockResolvedValue({ ...baseUser, role: 'BUYER' });
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    const result = await AdminUserService.updateUserRole('user-1', 'BUYER' as any, 'admin-1');

    expect(result.role).toBe('BUYER');
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: 'BUYER' } })
    );
  });

  it('logs user_role_changed with previous and new role', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, role: 'VENDOR' });
    mockPrisma.user.update.mockResolvedValue({ ...baseUser, role: 'ADMIN' });
    mockPrisma.adminActivityLog.create.mockResolvedValue({});

    await AdminUserService.updateUserRole('user-1', 'ADMIN' as any, 'admin-1');

    expect(mockPrisma.adminActivityLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action_type: 'user_role_changed',
          after_data: expect.objectContaining({ previous_role: 'VENDOR', new_role: 'ADMIN' }),
        }),
      })
    );
  });

  it('throws 404 when user is not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      AdminUserService.updateUserRole('missing', 'BUYER' as any, 'admin-1')
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
