import { prisma } from '@config/prisma.js';
import { waitlistLogger } from '@utils/logger.js';
import { JoinWaitlistInput } from '../validators/waitlistValidator.js';

// ============================================
// WAITLIST SERVICE
// ============================================

export class WaitlistService {
  /**
   * Adds a visitor to the waitlist.
   *
   * Email is the unique key, so a repeat submission updates the existing row
   * rather than erroring — people re-submit to fix a typo or change their mind
   * about the chat opt-in, and a 409 would just look like a broken form.
   *
   * @param data - Validated waitlist payload (phone already normalised)
   * @returns The created or updated WaitlistEntry
   */
  static async joinWaitlist(data: JoinWaitlistInput) {
    const { email, phone, user_type, trade_details, open_to_chat } = data;

    const existing = await prisma.waitlistEntry.findUnique({ where: { email } });

    const entry = existing
      ? await prisma.waitlistEntry.update({
          where: { email },
          data: { phone, user_type, trade_details, open_to_chat },
        })
      : await prisma.waitlistEntry.create({
          data: { email, phone, user_type, trade_details, open_to_chat },
        });

    waitlistLogger.info(existing ? 'Waitlist entry updated' : 'Waitlist entry created', {
      action: existing ? 'updateWaitlistEntry' : 'createWaitlistEntry',
      userType: user_type,
      openToChat: open_to_chat,
    });

    return { entry, isNew: !existing };
  }
}