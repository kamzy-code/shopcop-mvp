import { NextFunction, Request, Response } from 'express';
import { WaitlistService } from '@services/waitlistService.js';
import { joinWaitlistSchema } from '../validators/waitlistValidator.js';
import { waitlistLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';

export class WaitlistController {
  /**
   * POST /api/v1/waitlist
   * Adds a visitor to the waitlist, or updates their entry if the email is
   * already on the list. Public endpoint — no authentication required.
   *
   * @param req.body.email - Contact email (unique key)
   * @param req.body.phone - WhatsApp number, 0803… or +234803…
   * @param req.body.user_type - BUY | SELL | BOTH
   * @param req.body.trade_details - Short answer to "what do you buy or sell?"
   * @param req.body.open_to_chat - Opt-in for a 20 minute chat
   * @returns 201 `{ success: true, data: { open_to_chat }, message }` for a new entry
   * @returns 200 `{ success: true, data: { open_to_chat }, message }` when an
   *          existing entry was updated
   * @throws {AppError} 400 — Validation failure
   */
  static async joinWaitlist(req: Request, res: Response, next: NextFunction) {
    const action = 'joinWaitlist';

    const parsed = joinWaitlistSchema.safeParse(req.body);
    if (!parsed.success) {
      waitlistLogger.warn('Invalid waitlist signup input', {
        action,
        issues: parsed.error.issues,
      });
      throw new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400);
    }

    try {
      const { entry, isNew } = await WaitlistService.joinWaitlist(parsed.data);

      waitlistLogger.info(isNew ? 'Visitor joined waitlist' : 'Visitor updated waitlist entry', {
        action,
        openToChat: entry.open_to_chat,
      });

      res.status(isNew ? 201 : 200).json({
        success: true,
        data: {
          // The client uses this to decide whether to promise a 2 day follow-up.
          open_to_chat: entry.open_to_chat,
        },
        message: isNew
          ? "You're on the waitlist. We'll be in touch."
          : 'Your waitlist details have been updated.',
      });
    } catch (error) {
      waitlistLogger.error('Failed to join waitlist', {
        action,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }
}