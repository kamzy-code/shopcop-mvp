import { describe, it, expect } from 'vitest';
import { ProfileCompletenessService } from '@services/profileCompletenessService.js';

const baseProfile = {
  personal_info_complete: false,
  business_info_complete: false,
  verifications: [] as { type: string; status: string }[],
};

describe('ProfileCompletenessService', () => {
  describe('calculateCompleteness', () => {
    it('returns 0 when all fields are empty', () => {
      const result = ProfileCompletenessService.calculateCompleteness(baseProfile);
      expect(result).toBe(0);
    });

    it('returns 100 when all sections are complete and all verifications approved', () => {
      const profile = {
        personal_info_complete: true,
        business_info_complete: true,
        verifications: [
          { type: 'NIN', status: 'APPROVED' },
          { type: 'ADDRESS', status: 'APPROVED' },
          { type: 'CAC', status: 'APPROVED' },
        ],
        first_name: null,
        last_name: null,
        gender: null,
        date_of_birth: null,
        phone_number: null,
        business_name: null,
        business_description: null,
        state: null,
        city: null,
        street_address: null,
        primary_category: null,
        bank_name: null,
        account_number: null,
      };
      const result = ProfileCompletenessService.calculateCompleteness(profile);
      expect(result).toBe(100);
    });

    it('scores 20 for personal info complete flag alone', () => {
      const profile = { ...baseProfile, personal_info_complete: true };
      const result = ProfileCompletenessService.calculateCompleteness(profile);
      expect(result).toBe(20);
    });

    it('scores 20 for business info complete flag alone', () => {
      const profile = { ...baseProfile, business_info_complete: true };
      const result = ProfileCompletenessService.calculateCompleteness(profile);
      expect(result).toBe(20);
    });

    it('scores 20 for approved NIN verification', () => {
      const profile = {
        ...baseProfile,
        verifications: [{ type: 'NIN', status: 'APPROVED' }],
      };
      const result = ProfileCompletenessService.calculateCompleteness(profile);
      expect(result).toBe(20);
    });

    it('scores 15 for approved ADDRESS verification', () => {
      const profile = {
        ...baseProfile,
        verifications: [{ type: 'ADDRESS', status: 'APPROVED' }],
      };
      const result = ProfileCompletenessService.calculateCompleteness(profile);
      expect(result).toBe(15);
    });

    it('scores 25 for approved CAC verification', () => {
      const profile = {
        ...baseProfile,
        verifications: [{ type: 'CAC', status: 'APPROVED' }],
      };
      const result = ProfileCompletenessService.calculateCompleteness(profile);
      expect(result).toBe(25);
    });

    it('scores 25 for approved SMEDAN verification (same as CAC)', () => {
      const profile = {
        ...baseProfile,
        verifications: [{ type: 'SMEDAN', status: 'APPROVED' }],
      };
      const result = ProfileCompletenessService.calculateCompleteness(profile);
      expect(result).toBe(25);
    });

    it('does not double-count when both CAC and SMEDAN are approved', () => {
      const profile = {
        ...baseProfile,
        verifications: [
          { type: 'CAC', status: 'APPROVED' },
          { type: 'SMEDAN', status: 'APPROVED' },
        ],
      };
      const result = ProfileCompletenessService.calculateCompleteness(profile);
      expect(result).toBe(25);
    });

    it('ignores PENDING verifications', () => {
      const profile = {
        ...baseProfile,
        verifications: [{ type: 'NIN', status: 'PENDING' }],
      };
      const result = ProfileCompletenessService.calculateCompleteness(profile);
      expect(result).toBe(0);
    });

    it('ignores REJECTED verifications', () => {
      const profile = {
        ...baseProfile,
        verifications: [{ type: 'CAC', status: 'REJECTED' }],
      };
      const result = ProfileCompletenessService.calculateCompleteness(profile);
      expect(result).toBe(0);
    });

    it('calculates partial credit for partially filled personal info', () => {
      const profile = {
        ...baseProfile,
        first_name: 'Ada',
        last_name: null,
        gender: null,
        date_of_birth: null,
        phone_number: null,
      };
      const result = ProfileCompletenessService.calculateCompleteness(profile);
      // 1 of 5 personal fields = 20% * (1/5) = 4
      expect(result).toBe(4);
    });
  });

  describe('isPersonalInfoComplete', () => {
    it('returns true when all required personal fields are present', () => {
      const data = {
        first_name: 'Ada',
        last_name: 'Obi',
        gender: 'FEMALE' as const,
        date_of_birth: new Date('1995-06-15'),
        phone_number: '+2348012345678',
      };
      expect(ProfileCompletenessService.isPersonalInfoComplete(data)).toBe(true);
    });

    it('returns false when any required personal field is missing', () => {
      expect(
        ProfileCompletenessService.isPersonalInfoComplete({
          first_name: 'Ada',
          last_name: 'Obi',
          gender: 'FEMALE' as const,
          date_of_birth: new Date('1995-06-15'),
          // phone_number missing
        })
      ).toBe(false);
    });

    it('returns false for an empty object', () => {
      expect(ProfileCompletenessService.isPersonalInfoComplete({})).toBe(false);
    });
  });

  describe('isBusinessInfoComplete', () => {
    it('returns true when all required business fields are present', () => {
      const data = {
        business_name: 'Ada Store',
        business_description: 'We sell things',
        state: 'Lagos',
        city: 'Ikeja',
        street_address: '5 Allen Avenue',
        primary_category: 'fashion',
        subcategories: ['Clothing'],
        bank_name: 'GTBank',
        account_number: '0123456789',
        account_name: 'Ada Obi',
        payment_models: ['FULL_PAYMENT' as const],
      };
      expect(ProfileCompletenessService.isBusinessInfoComplete(data)).toBe(true);
    });

    it('returns false when subcategories array is empty', () => {
      const data = {
        business_name: 'Ada Store',
        business_description: 'We sell things',
        state: 'Lagos',
        city: 'Ikeja',
        street_address: '5 Allen Avenue',
        primary_category: 'fashion',
        subcategories: [],
        bank_name: 'GTBank',
        account_number: '0123456789',
        account_name: 'Ada Obi',
        payment_models: ['FULL_PAYMENT' as const],
      };
      expect(ProfileCompletenessService.isBusinessInfoComplete(data)).toBe(false);
    });

    it('returns false when payment_models array is empty', () => {
      const data = {
        business_name: 'Ada Store',
        business_description: 'We sell things',
        state: 'Lagos',
        city: 'Ikeja',
        street_address: '5 Allen Avenue',
        primary_category: 'fashion',
        subcategories: ['Clothing'],
        bank_name: 'GTBank',
        account_number: '0123456789',
        account_name: 'Ada Obi',
        payment_models: [],
      };
      expect(ProfileCompletenessService.isBusinessInfoComplete(data)).toBe(false);
    });
  });
});
