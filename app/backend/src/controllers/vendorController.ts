import { NextFunction, Request, Response } from 'express';
import { VendorProfileService } from '@services/vendorProfileService.js';
import { personalInfoSchema, businessInfoSchema } from '../validators/vendorProfileValidator.js';
import { vendorLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';

export class VendorProfileController {
  /**
   * POST /api/v1/profile/personal-info
   * Update personal information (Step 1 of vendor onboarding).
   * Validates input against personalInfoSchema and recalculates profile completeness.
   *
   * @param req.body.first_name - Vendor's first name
   * @param req.body.last_name - Vendor's last name
   * @param req.body.gender - Gender (Male, Female, Other)
   * @param req.body.date_of_birth - Date of birth (must be 16+)
   * @param req.body.phone_number - Nigerian phone number (e.g. +2348012345678)
   * @param req.user.userId - Authenticated user's ID (auto-populated by auth middleware)
   * @returns 200 `{ success, data: vendorProfile, message }`
   * @throws {AppError} 400 — Validation failure or age under 16
   * @throws {AppError} 401 — No authenticated user on the request
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
   * POST /api/v1/profile/business-info
   * Update business information (Step 2 of vendor onboarding).
   * Requires personal info to be completed first. Generates a unique slug from business name.
   *
   * @param req.body.business_name - Registered business name
   * @param req.body.business_description - Description of the business
   * @param req.body.state - Operating state
   * @param req.body.city - Operating city
   * @param req.body.street_address - Street address
   * @param req.body.primary_category - Primary business category ID
   * @param req.body.subcategories - Array of subcategory IDs
   * @param req.body.bank_name - Bank name for payouts
   * @param req.body.account_number - Bank account number
   * @param req.body.account_name - Bank account holder name
   * @param req.body.payment_models - Array of accepted payment models
   * @param req.user.userId - Authenticated user's ID (auto-populated by auth middleware)
   * @returns 200 `{ success, data: vendorProfile, message }`
   * @throws {AppError} 400 — Personal info not completed first or validation failure
   * @throws {AppError} 401 — No authenticated user on the request
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
   * GET /api/v1/profile
   * Get the authenticated vendor's full profile including verifications.
   *
   * @param req.user.userId - Authenticated user's ID (auto-populated by auth middleware)
   * @returns 200 `{ success, data: vendorProfile }`
   * @throws {AppError} 401 — No authenticated user on the request
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
   * GET /api/v1/profile/completeness
   * Get the authenticated vendor's profile completeness breakdown by section.
   *
   * @param req.user.userId - Authenticated user's ID (auto-populated by auth middleware)
   * @returns 200 `{ success, data: { total_completeness, sections } }`
   * @throws {AppError} 401 — No authenticated user on the request
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
}
