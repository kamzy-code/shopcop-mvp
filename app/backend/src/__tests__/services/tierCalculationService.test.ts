import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@config/prisma.js', () => ({
  prisma: {
    vendorVerification: { findMany: vi.fn() },
    vendorProfile: { update: vi.fn(), findUnique: vi.fn() },
  },
}));

import { TierCalculationService } from '@services/tierCalculationService.js';
import { prisma } from '@config/prisma.js';

const mockPrisma = prisma as any;

describe('TierCalculationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateAndUpdateTier', () => {
    it('assigns TIER_0 when no approved verifications', async () => {
      mockPrisma.vendorVerification.findMany.mockResolvedValue([]);
      mockPrisma.vendorProfile.update.mockResolvedValue({});

      const result = await TierCalculationService.calculateAndUpdateTier('vendor-1');
      expect(result).toBe('TIER_0');
      expect(mockPrisma.vendorProfile.update).toHaveBeenCalledWith({
        where: { id: 'vendor-1' },
        data: { verification_points: 0, current_tier: 'TIER_0' },
      });
    });

    it('assigns TIER_1 for 8 points (NIN = 10, boundary is 8)', async () => {
      mockPrisma.vendorVerification.findMany.mockResolvedValue([{ points_value: 8 }]);
      mockPrisma.vendorProfile.update.mockResolvedValue({});

      const result = await TierCalculationService.calculateAndUpdateTier('vendor-1');
      expect(result).toBe('TIER_1');
    });

    it('assigns TIER_1 for 10 points (NIN only)', async () => {
      mockPrisma.vendorVerification.findMany.mockResolvedValue([{ points_value: 10 }]);
      mockPrisma.vendorProfile.update.mockResolvedValue({});

      const result = await TierCalculationService.calculateAndUpdateTier('vendor-1');
      expect(result).toBe('TIER_1');
    });

    it('assigns TIER_2 for 15 points (NIN + SMEDAN)', async () => {
      mockPrisma.vendorVerification.findMany.mockResolvedValue([
        { points_value: 10 },
        { points_value: 5 },
      ]);
      mockPrisma.vendorProfile.update.mockResolvedValue({});

      const result = await TierCalculationService.calculateAndUpdateTier('vendor-1');
      expect(result).toBe('TIER_2');
    });

    it('assigns TIER_2 for 18 points', async () => {
      mockPrisma.vendorVerification.findMany.mockResolvedValue([
        { points_value: 10 },
        { points_value: 8 },
      ]);
      mockPrisma.vendorProfile.update.mockResolvedValue({});

      const result = await TierCalculationService.calculateAndUpdateTier('vendor-1');
      expect(result).toBe('TIER_2');
    });

    it('assigns TIER_3 for 25 points (NIN + CAC)', async () => {
      mockPrisma.vendorVerification.findMany.mockResolvedValue([
        { points_value: 10 },
        { points_value: 15 },
      ]);
      mockPrisma.vendorProfile.update.mockResolvedValue({});

      const result = await TierCalculationService.calculateAndUpdateTier('vendor-1');
      expect(result).toBe('TIER_3');
    });

    it('assigns TIER_4 for 30 points', async () => {
      mockPrisma.vendorVerification.findMany.mockResolvedValue([
        { points_value: 10 },
        { points_value: 15 },
        { points_value: 5 },
      ]);
      mockPrisma.vendorProfile.update.mockResolvedValue({});

      const result = await TierCalculationService.calculateAndUpdateTier('vendor-1');
      expect(result).toBe('TIER_4');
    });

    it('assigns TIER_0 for 7 points (one below TIER_1 threshold)', async () => {
      mockPrisma.vendorVerification.findMany.mockResolvedValue([{ points_value: 7 }]);
      mockPrisma.vendorProfile.update.mockResolvedValue({});

      const result = await TierCalculationService.calculateAndUpdateTier('vendor-1');
      expect(result).toBe('TIER_0');
    });

    it('propagates errors from the database', async () => {
      mockPrisma.vendorVerification.findMany.mockRejectedValue(new Error('DB error'));

      await expect(TierCalculationService.calculateAndUpdateTier('vendor-1')).rejects.toThrow(
        'DB error'
      );
    });
  });

  describe('getTierBreakdown', () => {
    it('throws 404 when vendor profile not found', async () => {
      mockPrisma.vendorProfile.findUnique.mockResolvedValue(null);

      await expect(TierCalculationService.getTierBreakdown('missing-id')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('returns correct breakdown for a vendor with verifications', async () => {
      mockPrisma.vendorProfile.findUnique.mockResolvedValue({
        id: 'vendor-1',
        current_tier: 'TIER_1',
        verification_points: 10,
        verifications: [
          { type: 'NIN', points_value: 10, approved_at: new Date('2026-01-01') },
        ],
      });

      const result = await TierCalculationService.getTierBreakdown('vendor-1');
      expect(result.current_tier).toBe('TIER_1');
      expect(result.total_points).toBe(10);
      expect(result.next_tier).toBe('TIER_2');
      expect(result.points_to_next_tier).toBe(5); // 15 - 10
      expect(result.verifications).toHaveLength(1);
      expect(result.verifications[0].type).toBe('NIN');
    });

    it('returns null for next_tier and points_to_next_tier when at TIER_4', async () => {
      mockPrisma.vendorProfile.findUnique.mockResolvedValue({
        id: 'vendor-1',
        current_tier: 'TIER_4',
        verification_points: 35,
        verifications: [],
      });

      const result = await TierCalculationService.getTierBreakdown('vendor-1');
      expect(result.next_tier).toBeNull();
      expect(result.points_to_next_tier).toBeNull();
    });
  });
});
