import { describe, it, expect } from 'vitest';
import {
  ninVerificationSchema,
  cacVerificationSchema,
  smedanVerificationSchema,
  addressVerificationSchema,
  resubmitVerificationSchema,
} from '@validators/verificationValidator.js';

describe('ninVerificationSchema', () => {
  const valid = {
    nin_number: '12345678901',
    nin_full_name: 'Ada Obi',
    govt_id_front_url: 'https://res.cloudinary.com/test/image/upload/v1/front.jpg',
    govt_id_front_public_id: 'test/front',
  };

  it('parses a valid NIN payload', () => {
    expect(ninVerificationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects NIN shorter than 11 digits', () => {
    expect(ninVerificationSchema.safeParse({ ...valid, nin_number: '1234567890' }).success).toBe(false);
  });

  it('rejects NIN longer than 11 digits', () => {
    expect(ninVerificationSchema.safeParse({ ...valid, nin_number: '123456789012' }).success).toBe(false);
  });

  it('rejects NIN containing letters', () => {
    expect(ninVerificationSchema.safeParse({ ...valid, nin_number: '1234567890A' }).success).toBe(false);
  });

  it('requires govt_id_front_url to be a valid URL', () => {
    expect(
      ninVerificationSchema.safeParse({ ...valid, govt_id_front_url: 'not-a-url' }).success
    ).toBe(false);
  });

  it('requires govt_id_front_public_id', () => {
    expect(
      ninVerificationSchema.safeParse({ ...valid, govt_id_front_public_id: '' }).success
    ).toBe(false);
  });
});

describe('cacVerificationSchema', () => {
  const valid = {
    cac_rc_number: 'RC123456',
    cac_company_type: 'BUSINESS_NAME',
    cac_certificate_url: 'https://res.cloudinary.com/test/raw/upload/v1/cert.pdf',
    cac_certificate_public_id: 'test/cert',
  };

  it('parses a valid CAC payload', () => {
    expect(cacVerificationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects RC number with special characters other than hyphens', () => {
    expect(
      cacVerificationSchema.safeParse({ ...valid, cac_rc_number: 'RC@123' }).success
    ).toBe(false);
  });

  it('rejects an invalid company type', () => {
    expect(
      cacVerificationSchema.safeParse({ ...valid, cac_company_type: 'UNKNOWN_TYPE' }).success
    ).toBe(false);
  });
});

describe('smedanVerificationSchema', () => {
  const valid = {
    smedan_suin: 'SUIN-12345',
    smedan_business_type: 'SOLE_PROPRIETOR',
    smedan_certificate_url: 'https://res.cloudinary.com/test/raw/upload/v1/smedan.pdf',
    smedan_certificate_public_id: 'test/smedan',
  };

  it('parses a valid SMEDAN payload', () => {
    expect(smedanVerificationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects SUIN shorter than 5 characters', () => {
    expect(smedanVerificationSchema.safeParse({ ...valid, smedan_suin: 'S12' }).success).toBe(false);
  });

  it('rejects invalid business type', () => {
    expect(
      smedanVerificationSchema.safeParse({ ...valid, smedan_business_type: 'FAKE' }).success
    ).toBe(false);
  });
});

describe('addressVerificationSchema', () => {
  const valid = {
    address_document_url: 'https://res.cloudinary.com/test/image/upload/v1/address.jpg',
    address_document_public_id: 'test/address',
  };

  it('parses a valid address payload', () => {
    expect(addressVerificationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an invalid URL', () => {
    expect(
      addressVerificationSchema.safeParse({ ...valid, address_document_url: 'not-a-url' }).success
    ).toBe(false);
  });

  it('requires address_document_public_id', () => {
    expect(
      addressVerificationSchema.safeParse({ ...valid, address_document_public_id: '' }).success
    ).toBe(false);
  });
});

describe('resubmitVerificationSchema', () => {
  it('accepts a partial payload with only NIN fields', () => {
    const result = resubmitVerificationSchema.safeParse({
      nin_number: '12345678901',
      nin_full_name: 'Ada Obi',
      govt_id_front_url: 'https://res.cloudinary.com/test/image/upload/v1/front.jpg',
      govt_id_front_public_id: 'test/front',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a partial payload with only address fields', () => {
    const result = resubmitVerificationSchema.safeParse({
      address_document_url: 'https://res.cloudinary.com/test/image/upload/v1/address.jpg',
      address_document_public_id: 'test/address',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty object (at-least-one-field constraint)', () => {
    const result = resubmitVerificationSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
