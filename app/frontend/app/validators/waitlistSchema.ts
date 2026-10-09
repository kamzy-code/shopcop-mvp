import { z } from 'zod';
import { emailSchema } from './authSchema';

export const waitlistUserTypeSchema = z.enum(['BUY', 'SELL'], {
  message: 'Please select whether you buy or sell',
});

export const whatsappSchema = z
  .string()
  .trim()
  .regex(/^(\+234|0)[789]\d{9}$/, 'Enter a valid WhatsApp number, e.g. 0803 123 4567');

export const waitlistSchema = z.object({
  email: emailSchema,
  phone: whatsappSchema,
  user_type: waitlistUserTypeSchema,
  trade_details: z
    .string()
    .trim()
    .min(3, 'Tell us briefly what you buy or sell')
    .max(500, 'Please keep this under 500 characters'),
  challenges: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
  open_to_chat: z.boolean(),
});