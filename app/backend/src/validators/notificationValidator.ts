import { z } from 'zod';

/**
 * Query params for GET /api/v1/notifications/new
 * `since` must be a valid ISO8601 datetime string.
 */
export const getNewNotificationsSchema = z.object({
  since: z.string({ message: '`since` query param is required' }).superRefine((val, ctx) => {
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      ctx.addIssue({
        code: 'custom',
        message: '`since` must be a valid ISO8601 datetime',
      });
    }
  }),
});
