import { NextFunction, Request, Response } from 'express';
import { VendorProfileService } from '@services/vendorProfileService.js';
import { personalInfoSchema, businessInfoSchema, profilePhotoSchema } from '../validators/vendorProfileValidator.js';
import { vendorLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';

export class VendorProfileController {
  /**
   * Create or update personal info (step 1 of onboarding; also used for post-onboarding edits).
   * Validates age (≥16), normalises phone to +234 format, and syncs User.name.
   *
   * @route  POST /api/v1/vendors/personal-info
   * @access Vendor (authenticated)
   * @param req.body.first_name - Vendor's first name
   * @param req.body.last_name - Vendor's last name
   * @param req.body.middle_name - Middle name (optional)
   * @param req.body.gender - MALE | FEMALE | PREFER_NOT_TO_SAY
   * @param req.body.date_of_birth - Date of birth (must be ≥16)
   * @param req.body.phone_number - Nigerian phone number (e.g. 08012345678 or +2348012345678)
   * @param req.user.userId - Authenticated user's ID (set by auth middleware)
   * @returns 200 `{ success, data: vendorProfile, message }`
   * @throws {AppError} 400 — Validation failure or age under 16
   * @throws {AppError} 401 — Unauthenticated request
   */
  static async updatePersonalInfo(req: Request, res: Response, next: NextFunction) {
    const action = 'updatePersonalInfo';
    const userId = req.user!.userId;

    const parsed = personalInfoSchema.safeParse(req.body);
    if (!parsed.success) {
      vendorLogger.warn('Invalid personal info input', { action, userId, issues: parsed.error.issues });
      throw new AppError(`Invalid personal info input: ${parseZodErrors(parsed.error.issues)}`, 400);
    }

    try {
      const profile = await VendorProfileService.updatePersonalInfo(userId, parsed.data);

      vendorLogger.info('Personal info updated successfully', {
        action,
        userId,
        profileCompleteness: profile.profile_completeness,
      });

      res.status(200).json({
        success: true,
        data: profile,
        message: 'Personal information updated successfully',
      });
    } catch (error) {
      vendorLogger.error('Failed to update personal info', {
        action,
        userId,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * Create or update business info (step 2 of onboarding; also used for post-onboarding edits).
   * Requires personal info to be completed first. Generates a unique URL slug from business_name.
   *
   * @route  POST /api/v1/vendors/business-info
   * @access Vendor (authenticated)
   * @param req.body.business_name - Registered business name
   * @param req.body.business_description - Description of the business (50–500 chars)
   * @param req.body.state - Nigerian state of operation
   * @param req.body.city - City of operation
   * @param req.body.street_address - Street address (min 5 chars)
   * @param req.body.primary_category - Primary business category
   * @param req.body.subcategories - Array of subcategories (1–3)
   * @param req.body.bank_name - Bank name for payouts
   * @param req.body.account_number - 10-digit bank account number
   * @param req.body.account_name - Bank account holder name
   * @param req.body.payment_models - Accepted payment models (FULL_PAYMENT | PAY_ON_DELIVERY | …)
   * @param req.body.refund_policy_type - NO_REFUNDS | FULL_REFUND | PARTIAL_REFUND | EXCHANGE_ONLY | STORE_CREDIT | CASE_BY_CASE
   * @param req.body.refund_duration_days - Optional refund window in days (1–90)
   * @param req.body.refund_conditions - Optional array of conditions (max 10, each max 200 chars)
   * @param req.body.refund_custom_notes - Optional free-text notes (max 500 chars)
   * @param req.user.userId - Authenticated user's ID (set by auth middleware)
   * @returns 200 `{ success, data: vendorProfile, message }`
   * @throws {AppError} 400 — Personal info not completed first, or validation failure
   * @throws {AppError} 401 — Unauthenticated request
   */
  static async updateBusinessInfo(req: Request, res: Response, next: NextFunction) {
    const action = 'updateBusinessInfo';
    const userId = req.user!.userId;

    const parsed = businessInfoSchema.safeParse(req.body);
    if (!parsed.success) {
      vendorLogger.warn('Invalid business info input', { action, userId, issues: parsed.error.issues });
      throw new AppError(`Invalid business info input: ${parseZodErrors(parsed.error.issues)}`, 400);
    }

    try {
      const profile = await VendorProfileService.updateBusinessInfo(userId, parsed.data);

      vendorLogger.info('Business info updated successfully', {
        action,
        userId,
        profileCompleteness: profile.profile_completeness,
      });

      res.status(200).json({
        success: true,
        data: profile,
        message: 'Business information updated successfully',
      });
    } catch (error) {
      vendorLogger.error('Failed to update business info', {
        action,
        userId,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * Get the authenticated vendor's full profile including verifications and completeness score.
   *
   * @route  GET /api/v1/vendors
   * @access Vendor (authenticated)
   * @param req.user.userId - Authenticated user's ID (set by auth middleware)
   * @returns 200 `{ success, data: vendorProfile }` | 404 `{ success: false, message }`
   * @throws {AppError} 401 — Unauthenticated request
   * @throws {AppError} 404 — Vendor profile not found
   */
  static async getVendorProfile(req: Request, res: Response, next: NextFunction) {
    const action = 'getVendorProfile';
    const userId = req.user!.userId;

    try {
      const profile = await VendorProfileService.getVendorProfileWithVerifications(userId);

      if (!profile) {
        vendorLogger.warn('Vendor profile not found', { action, userId });
        throw new AppError('Vendor profile not found', 404);
      }

      vendorLogger.info('Get vendor profile successful', { action, userId });
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      vendorLogger.error('Failed to get vendor profile', {
        action,
        userId,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * Get a section-by-section breakdown of the authenticated vendor's profile completeness.
   *
   * @route  GET /api/v1/vendors/completeness
   * @access Vendor (authenticated)
   * @param req.user.userId - Authenticated user's ID (set by auth middleware)
   * @returns 200 `{ success, data: { total_completeness, sections } }`
   * @throws {AppError} 401 — Unauthenticated request
   */
  static async getProfileCompleteness(req: Request, res: Response, next: NextFunction) {
    const action = 'getProfileCompleteness';
    const userId = req.user!.userId;

    try {
      const breakdown = await VendorProfileService.getProfileCompletenessBreakdown(userId);

      vendorLogger.info('Get profile completeness successful', {
        action,
        userId,
        profileCompleteness: breakdown.total_completeness,
      });

      res.status(200).json({ success: true, data: breakdown });
    } catch (error) {
      vendorLogger.error('Failed to get profile completeness', {
        action,
        userId,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * Update the vendor's profile photo.
   *
   * @route  PATCH /api/v1/vendors/profile-photo
   * @access Vendor (authenticated)
   * @param req.body.profile_photo_url - Cloudinary URL of the uploaded photo
   * @returns 200 `{ success, data: vendorProfile }`
   */
  static async updateProfilePhoto(req: Request, res: Response, next: NextFunction) {
    const action = 'updateProfilePhoto';
    const userId = req.user!.userId;

    const parsed = profilePhotoSchema.safeParse(req.body);
    if (!parsed.success) {
      vendorLogger.warn('Invalid profile photo input', { action, userId, issues: parsed.error.issues });
      throw new AppError(`Invalid profile photo input: ${parseZodErrors(parsed.error.issues)}`, 400);
    }

    try {
      const profile = await VendorProfileService.updateProfilePhoto(
        userId,
        parsed.data.profile_photo_url,
        parsed.data.profile_photo_public_id,
      );

      vendorLogger.info('Profile photo updated successfully', { action, userId });

      res.status(200).json({
        success: true,
        data: profile,
        message: 'Profile photo updated successfully',
      });
    } catch (error) {
      vendorLogger.error('Failed to update profile photo', {
        action,
        userId,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }
}
