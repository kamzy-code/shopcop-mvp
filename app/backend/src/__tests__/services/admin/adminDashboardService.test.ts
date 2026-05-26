import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@config/prisma.js', () => ({
  prisma: {
    user: { count: vi.fn() },
    vendorVerification: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    vendorProfile: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    adminActivityLog: { findMany: vi.fn() },
  },
}));

import { AdminDashboardService } from '@services/admin/adminDashboardService.js';
import { prisma } from '@config/prisma.js';

const mockPrisma = prisma as any;

beforeEach(() => {
  vi.resetAllMocks();
});

function setupDefaultMocks() {
  // user.count is called 8 times — return a distinct value for each position
  mockPrisma.user.count
    .mockResolvedValueOnce(100)  // totalUsers
    .mockResolvedValueOnce(60)   // vendorCount
    .mockResolvedValueOnce(30)   // buyerCount
    .mockResolvedValueOnce(10)   // adminCount
    .mockResolvedValueOnce(90)   // activeUsers
    .mockResolvedValueOnce(10)   // inactiveUsers
    .mockResolvedValueOnce(5)    // newLast7Days
    .mockResolvedValueOnce(20);  // newLast30Days

  mockPrisma.vendorVerification.count
    .mockResolvedValueOnce(8)    // totalPending
    .mockResolvedValueOnce(50)   // totalApproved
    .mockResolvedValueOnce(12);  // totalRejected

  mockPrisma.vendorVerification.groupBy.mockResolvedValue([
    { type: 'NIN', _count: 4 },
    { type: 'CAC', _count: 4 },
  ]);

  mockPrisma.vendorProfile.groupBy.mockResolvedValue([
    { current_tier: 'TIER_0', _count: 40 },
    { current_tier: 'TIER_1', _count: 20 },
  ]);

  mockPrisma.vendorProfile.count
    .mockResolvedValueOnce(45)   // vendorsWithBusinessInfo
    .mockResolvedValueOnce(55);  // vendorsWithPersonalInfo

  mockPrisma.adminActivityLog.findMany.mockResolvedValue([
    { id: 'log-1', action_type: 'verification_approved', admin: { id: 'a-1', email: 'admin@test.com', name: null } },
  ]);
}

// ============================================
// getDashboardStats
// ============================================

describe('AdminDashboardService.getDashboardStats', () => {
  it('returns correct user statistics', async () => {
    setupDefaultMocks();

    const result = await AdminDashboardService.getDashboardStats();

    expect(result.users.total).toBe(100);
    expect(result.users.by_role.VENDOR).toBe(60);
    expect(result.users.by_role.BUYER).toBe(30);
    expect(result.users.by_role.ADMIN).toBe(10);
    expect(result.users.active).toBe(90);
    expect(result.users.inactive).toBe(10);
    expect(result.users.new_last_7_days).toBe(5);
    expect(result.users.new_last_30_days).toBe(20);
  });

  it('returns correct verification statistics', async () => {
    setupDefaultMocks();

    const result = await AdminDashboardService.getDashboardStats();

    expect(result.verifications.total_pending).toBe(8);
    expect(result.verifications.total_approved).toBe(50);
    expect(result.verifications.total_rejected).toBe(12);
    expect(result.verifications.pending_by_type).toHaveLength(2);
    expect(result.verifications.pending_by_type[0]).toEqual({ type: 'NIN', count: 4 });
  });

  it('returns correct vendor statistics', async () => {
    setupDefaultMocks();

    const result = await AdminDashboardService.getDashboardStats();

    expect(result.vendors.tier_distribution).toHaveLength(2);
    expect(result.vendors.with_business_info).toBe(45);
    expect(result.vendors.with_personal_info).toBe(55);
  });

  it('returns recent activity list', async () => {
    setupDefaultMocks();

    const result = await AdminDashboardService.getDashboardStats();

    expect(result.recent_activity).toHaveLength(1);
    expect(result.recent_activity[0].action_type).toBe('verification_approved');
  });

  it('propagates errors from prisma', async () => {
    mockPrisma.user.count.mockRejectedValue(new Error('DB error'));

    await expect(AdminDashboardService.getDashboardStats()).rejects.toThrow('DB error');
  });
});
