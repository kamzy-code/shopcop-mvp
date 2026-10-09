import { z } from 'zod';

/** Normalises a Nigerian phone number to the +234 international format. */
function normalizePhone(val: string) {
  if (val.startsWith('0')) return '+234' + val.slice(1);
  return val;
}

/**
 * Schema for a public waitlist signup.
 * `user_type` mirrors the WaitlistUserType Prisma enum; every other field is
 * collected by the landing page form.
 */
export const joinWaitlistSchema = z.object({
  /** Contact email. Also the natural unique key for a waitlist entry. */
  email: z.email('Invalid email address').max(255, 'Email must be under 255 characters'),

  /** Nigerian WhatsApp number, accepted as 0803… or +234803…. Stored as +234…. */
  phone: z
    .string()
    .trim()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Enter a valid Nigerian WhatsApp number, e.g. 0803 123 4567')
    .transform(normalizePhone),

  /** Whether the visitor buys or sells. */
  user_type: z.enum(['BUY', 'SELL'], {
    message: 'Select whether you buy or sell',
  }),

  /** Short free-text answer to "what do you buy or sell?". */
  trade_details: z
    .string()
    .trim()
    .min(3, 'Tell us briefly what you buy or sell')
    .max(500, 'Please keep this under 500 characters'),

  /** Multi-select answer to the challenges question. */
  challenges: z
    .array(z.string().trim().min(1).max(200))
    .max(10, 'Please select at most 10 challenges')
    .default([]),

  /** Opt-in for a 20 minute research chat. */
  open_to_chat: z.boolean().default(false),
});

export type JoinWaitlistInput = z.infer<typeof joinWaitlistSchema>;