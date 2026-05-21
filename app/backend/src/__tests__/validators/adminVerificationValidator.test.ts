import { describe, it, expect } from 'vitest';
import {
  approveVerificationSchema,
  rejectVerificationSchema,
} from '@validators/adminVerificationValidator.js';

describe('approveVerificationSchema', () => {
  it('parses with no fields (all optional)', () => {
    expect(approveVerificationSchema.safeParse({}).success).toBe(true);
  });

  it('parses with an optional admin note', () => {
    expect(
      approveVerificationSchema.safeParse({ admin_notes: 'Looks good.' }).success
    ).toBe(true);
  });

  it('rejects admin_notes exceeding 500 characters', () => {
    const result = approveVerificationSchema.safeParse({
      admin_notes: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe('rejectVerificationSchema', () => {
  it('parses a valid rejection with a reason', () => {
    const result = rejectVerificationSchema.safeParse({
      rejection_reason: 'Document is blurry and unreadable.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a reason that is exactly 9 characters (below 10 minimum)', () => {
    const result = rejectVerificationSchema.safeParse({
      rejection_reason: 'Too short',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a reason that is exactly 10 characters (minimum boundary)', () => {
    const result = rejectVerificationSchema.safeParse({
      rejection_reason: 'Short rea.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a reason exceeding 500 characters', () => {
    const result = rejectVerificationSchema.safeParse({
      rejection_reason: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('requires rejection_reason', () => {
    const result = rejectVerificationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('parses with optional admin_notes alongside rejection_reason', () => {
    const result = rejectVerificationSchema.safeParse({
      rejection_reason: 'Document is invalid and expired.',
      admin_notes: 'Contacted vendor via email.',
    });
    expect(result.success).toBe(true);
  });
});
