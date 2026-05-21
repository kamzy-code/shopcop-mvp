import { prisma } from '@config/prisma.js';
import { vendorLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { VerificationType, VerificationStatus } from '../generated/prisma/client.js';
import {
  NINVerificationInput,
  AddressVerificationInput,
  CACVerificationInput,
  SMEDANVerificationInput,
  verificationPoints,
} from '../types/vendorVerificationTypes.js';

// ============================================
// VERIFICATION SERVICE
// ============================================

export class VerificationService {
  /**
   * Submit NIN verification for identity verification.
   * Requires personal info to be completed first.
   * Prevents duplicate PENDING or APPROVED submissions.
   *
   * @param vendorId - Vendor profile ID
   * @param data - NIN verification input including NIN number, full name, and document URLs/public_ids
   * @returns The created VendorVerification record
   * @throws {AppError} 400 — Personal info not complete
   * @throws {AppError} 404 — Vendor profile not found
   * @throws {AppError} 409 — NIN verification already pending or approved
   */
  static async submitNINVerification(vendorId: string, data: NINVerificationInput) {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendorProfile) {
      vendorLogger.warn('Vendor profile not found', {
        action: 'submitNINVerification',
        vendorId,
      });
      throw new AppError('Vendor profile not found', 404);
    }

    if (!vendorProfile.personal_info_complete) {
      vendorLogger.warn('Personal info not complete', {
        action: 'submitNINVerification',
        vendorId,
      });
      throw new AppError('Please complete your personal information first', 400);
    }

    const existingVerification = await prisma.vendorVerification.findFirst({
      where: {
        vendor_id: vendorId,
        type: VerificationType.NIN,
        status: {
          in: [VerificationStatus.PENDING, VerificationStatus.APPROVED],
        },
      },
    });

    if (existingVerification) {
      if (existingVerification.status === VerificationStatus.APPROVED) {
        throw new AppError('NIN verification is already approved', 409);
      }
      throw new AppError('NIN verification is already pending review', 409);
    }

    const verification = await prisma.vendorVerification.create({
      data: {
        vendor_id: vendorId,
        type: VerificationType.NIN,
        status: VerificationStatus.PENDING,
        points_value: verificationPoints.NIN_VERIFIED,
        ...data,
      },
    });

    vendorLogger.info('NIN verification submitted', {
      action: 'submitNINVerification',
      vendorId,
    });

    return verification;
  }

  /**
   * Submit CAC business registration verification.
   * Requires business info to be completed first.
   * Prevents duplicate PENDING or APPROVED submissions.
   *
   * @param vendorId - Vendor profile ID
   * @param data - CAC verification input including RC number, company type, and certificate document
   * @returns The created VendorVerification record
   * @throws {AppError} 400 — Business info not complete
   * @throws {AppError} 404 — Vendor profile not found
   * @throws {AppError} 409 — CAC verification already pending or approved
   */
  static async submitCACVerification(vendorId: string, data: CACVerificationInput) {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendorProfile) {
      vendorLogger.warn('Vendor profile not found', {
        action: 'submitCACVerification',
        vendorId,
      });
      throw new AppError('Vendor profile not found', 404);
    }

    if (!vendorProfile.business_info_complete) {
      vendorLogger.warn('Business info not complete', {
        action: 'submitCACVerification',
        vendorId,
      });
      throw new AppError('Please complete your business information first', 400);
    }

    const existingVerification = await prisma.vendorVerification.findFirst({
      where: {
        vendor_id: vendorId,
        type: VerificationType.CAC,
        status: {
          in: [VerificationStatus.PENDING, VerificationStatus.APPROVED],
        },
      },
    });

    if (existingVerification) {
      if (existingVerification.status === VerificationStatus.APPROVED) {
        throw new AppError('CAC verification is already approved', 409);
      }
      throw new AppError('CAC verification is already pending review', 409);
    }

    const verification = await prisma.vendorVerification.create({
      data: {
        vendor_id: vendorId,
        type: VerificationType.CAC,
        status: VerificationStatus.PENDING,
        points_value: verificationPoints.CAC_VERIFIED,
        ...data,
      },
    });

    vendorLogger.info('CAC verification submitted', {
      action: 'submitCACVerification',
      vendorId,
    });

    return verification;
  }

  /**
   * Submit SMEDAN registration verification.
   * Requires business info to be completed first.
   * Prevents duplicate PENDING or APPROVED submissions.
   *
   * @param vendorId - Vendor profile ID
   * @param data - SMEDAN verification input including SUIN, business type, and certificate document
   * @returns The created VendorVerification record
   * @throws {AppError} 400 — Business info not complete
   * @throws {AppError} 404 — Vendor profile not found
   * @throws {AppError} 409 — SMEDAN verification already pending or approved
   */
  static async submitSMEDANVerification(vendorId: string, data: SMEDANVerificationInput) {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendorProfile) {
      vendorLogger.warn('Vendor profile not found', {
        action: 'submitSMEDANVerification',
        vendorId,
      });
      throw new AppError('Vendor profile not found', 404);
    }

    if (!vendorProfile.business_info_complete) {
      vendorLogger.warn('Business info not complete', {
        action: 'submitSMEDANVerification',
        vendorId,
      });
      throw new AppError('Please complete your business information first', 400);
    }

    const existingVerification = await prisma.vendorVerification.findFirst({
      where: {
        vendor_id: vendorId,
        type: VerificationType.SMEDAN,
        status: {
          in: [VerificationStatus.PENDING, VerificationStatus.APPROVED],
        },
      },
    });

    if (existingVerification) {
      if (existingVerification.status === VerificationStatus.APPROVED) {
        throw new AppError('SMEDAN verification is already approved', 409);
      }
      throw new AppError('SMEDAN verification is already pending review', 409);
    }

    const verification = await prisma.vendorVerification.create({
      data: {
        vendor_id: vendorId,
        type: VerificationType.SMEDAN,
        status: VerificationStatus.PENDING,
        points_value: verificationPoints.SMEDAN_VERIFIED,
        ...data,
      },
    });

    vendorLogger.info('SMEDAN verification submitted', {
      action: 'submitSMEDANVerification',
      vendorId,
    });

    return verification;
  }

  /**
   * Submit proof-of-address document for address verification.
   * Requires business info with street address to be completed first.
   * Prevents duplicate PENDING or APPROVED submissions.
   *
   * @param vendorId - Vendor profile ID
   * @param data - Address verification input including document URL and public_id
   * @returns The created VendorVerification record
   * @throws {AppError} 400 — Business address info not complete
   * @throws {AppError} 404 — Vendor profile not found
   * @throws {AppError} 409 — Address verification already pending or approved
   */
  static async submitAddressVerification(vendorId: string, data: AddressVerificationInput) {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendorProfile) {
      vendorLogger.warn('Vendor profile not found', {
        action: 'submitAddressVerification',
        vendorId,
      });
      throw new AppError('Vendor profile not found', 404);
    }

    if (!vendorProfile.business_info_complete || !vendorProfile.street_address) {
      vendorLogger.warn('Business address info not complete', {
        action: 'submitAddressVerification',
        vendorId,
      });
      throw new AppError('Please complete your business address information first', 400);
    }

    const existingVerification = await prisma.vendorVerification.findFirst({
      where: {
        vendor_id: vendorId,
        type: VerificationType.ADDRESS,
        status: {
          in: [VerificationStatus.PENDING, VerificationStatus.APPROVED],
        },
      },
    });

    if (existingVerification) {
      if (existingVerification.status === VerificationStatus.APPROVED) {
        throw new AppError('Address verification is already approved', 409);
      }
      throw new AppError('Address verification is already pending review', 409);
    }

    const verification = await prisma.vendorVerification.create({
      data: {
        vendor_id: vendorId,
        type: VerificationType.ADDRESS,
        status: VerificationStatus.PENDING,
        points_value: verificationPoints.ADDRESS_VERIFIED,
        ...data,
      },
    });

    vendorLogger.info('Address verification submitted', {
      action: 'submitAddressVerification',
      vendorId,
    });

    return verification;
  }

  /**
   * Get all verifications for a vendor, ordered by submission date (newest first).
   *
   * @param vendorId - Vendor profile ID
   * @returns Array of VendorVerification records
   */
  static async getVendorVerifications(vendorId: string) {
    return prisma.vendorVerification.findMany({
      where: { vendor_id: vendorId },
      orderBy: { submitted_at: 'desc' },
    });
  }

  /**
   * Get a single verification by its ID, including vendor and user email.
   *
   * @param verificationId - Verification record ID
   * @returns VendorVerification with included vendor and user relations, or null if not found
   */
  static async getVerificationById(verificationId: string) {
    return prisma.vendorVerification.findUnique({
      where: { id: verificationId },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Resubmit a rejected verification with updated data.
   * Only verifications in REJECTED status can be resubmitted.
   * Resets status to PENDING and clears rejection-related fields.
   *
   * @param verificationId - Verification record ID to resubmit
   * @param vendorId - Vendor profile ID (ownership verification)
   * @param updateData - Partial verification data matching the verification type
   * @returns The updated VendorVerification record
   * @throws {AppError} 400 — Verification is not in REJECTED status
   * @throws {AppError} 404 — Verification not found
   */
  static async resubmitVerification(
    verificationId: string,
    vendorId: string,
    updateData: Partial<
      | NINVerificationInput
      | CACVerificationInput
      | SMEDANVerificationInput
      | AddressVerificationInput
    >
  ) {
    const existingVerification = await prisma.vendorVerification.findFirst({
      where: {
        id: verificationId,
        vendor_id: vendorId,
      },
    });

    if (!existingVerification) {
      vendorLogger.warn('Verification not found for resubmission', {
        action: 'resubmitVerification',
        verificationId,
        vendorId,
      });
      throw new AppError('Verification not found', 404);
    }

    if (existingVerification.status !== VerificationStatus.REJECTED) {
      vendorLogger.warn('Only rejected verifications can be resubmitted', {
        action: 'resubmitVerification',
        verificationId,
        vendorId,
        currentStatus: existingVerification.status,
      });
      throw new AppError('Only rejected verifications can be resubmitted', 400);
    }

    const verification = await prisma.vendorVerification.update({
      where: { id: verificationId },
      data: {
        ...updateData,
        status: VerificationStatus.PENDING,
        rejection_reason: null,
        admin_notes: null,
        reviewed_by: null,
        reviewed_at: null,
        submitted_at: new Date(),
      },
    });

    vendorLogger.info('Verification resubmitted', {
      action: 'resubmitVerification',
      verificationId,
      vendorId,
    });

    return verification;
  }
}
