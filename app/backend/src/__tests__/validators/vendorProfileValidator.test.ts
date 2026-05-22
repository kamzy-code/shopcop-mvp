import { describe, it, expect } from 'vitest';
import { personalInfoSchema, businessInfoSchema } from '@validators/vendorProfileValidator.js';

describe('personalInfoSchema', () => {
  const validPersonalInfo = {
    first_name: 'Ada',
    last_name: 'Obi',
    gender: 'FEMALE',
    date_of_birth: '2000-01-01',
    phone_number: '08012345678',
  };

  it('parses a valid personal info payload', () => {
    const result = personalInfoSchema.safeParse(validPersonalInfo);
    expect(result.success).toBe(true);
  });

  it('normalises 0-prefix phone to +234 format', () => {
    const result = personalInfoSchema.safeParse(validPersonalInfo);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone_number).toBe('+2348012345678');
    }
  });

  it('accepts +234 prefix phone number as-is', () => {
    const result = personalInfoSchema.safeParse({
      ...validPersonalInfo,
      phone_number: '+2348012345678',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone_number).toBe('+2348012345678');
    }
  });

  it('rejects an invalid phone number format', () => {
    const result = personalInfoSchema.safeParse({
      ...validPersonalInfo,
      phone_number: '1234567890',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a vendor who is exactly 15 years old', () => {
    const fifteenYearsAgo = new Date();
    fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
    const result = personalInfoSchema.safeParse({
      ...validPersonalInfo,
      date_of_birth: fifteenYearsAgo.toISOString().split('T')[0],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a vendor who is exactly 16 years old', () => {
    const sixteenYearsAgo = new Date();
    sixteenYearsAgo.setFullYear(sixteenYearsAgo.getFullYear() - 16);
    const result = personalInfoSchema.safeParse({
      ...validPersonalInfo,
      date_of_birth: sixteenYearsAgo.toISOString().split('T')[0],
    });
    expect(result.success).toBe(true);
  });

  it('rejects first_name with numbers', () => {
    const result = personalInfoSchema.safeParse({
      ...validPersonalInfo,
      first_name: 'Ada123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects first_name shorter than 2 characters', () => {
    const result = personalInfoSchema.safeParse({
      ...validPersonalInfo,
      first_name: 'A',
    });
    expect(result.success).toBe(false);
  });

  it('requires first_name', () => {
    const { first_name, ...rest } = validPersonalInfo;
    void first_name;
    const result = personalInfoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('requires last_name', () => {
    const { last_name, ...rest } = validPersonalInfo;
    void last_name;
    const result = personalInfoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects invalid gender value', () => {
    const result = personalInfoSchema.safeParse({
      ...validPersonalInfo,
      gender: 'UNKNOWN',
    });
    expect(result.success).toBe(false);
  });
});

describe('businessInfoSchema', () => {
  const validBusinessInfo = {
    business_name: 'Ada Fashion Hub',
    business_description:
      'We specialise in high-quality Nigerian fashion items and accessories for the modern woman.',
    state: 'Lagos',
    city: 'Ikeja',
    street_address: '5 Allen Avenue',
    primary_category: 'fashion',
    subcategories: ['Clothing'],
    bank_name: 'GTBank',
    account_number: '0123456789',
    account_name: 'Ada Obi',
    payment_models: ['FULL_PAYMENT'],
    refund_policy_type: 'NO_REFUNDS',
  };

  it('parses a valid business info payload', () => {
    const result = businessInfoSchema.safeParse(validBusinessInfo);
    expect(result.success).toBe(true);
  });

  it('rejects more than 3 subcategories', () => {
    const result = businessInfoSchema.safeParse({
      ...validBusinessInfo,
      subcategories: ['Clothing', 'Footwear', 'Accessories', 'Bags'],
    });
    expect(result.success).toBe(false);
  });

  it('requires at least 1 subcategory', () => {
    const result = businessInfoSchema.safeParse({
      ...validBusinessInfo,
      subcategories: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects account_number that is not 10 digits', () => {
    const result = businessInfoSchema.safeParse({
      ...validBusinessInfo,
      account_number: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('rejects business description shorter than 50 characters', () => {
    const result = businessInfoSchema.safeParse({
      ...validBusinessInfo,
      business_description: 'Too short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid refund policy type', () => {
    const result = businessInfoSchema.safeParse({
      ...validBusinessInfo,
      refund_policy_type: 'INVALID_TYPE',
    });
    expect(result.success).toBe(false);
  });
});
