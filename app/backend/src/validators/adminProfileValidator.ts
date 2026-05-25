import { z } from 'zod';
import { Gender } from '../generated/prisma/client.js';

const NAME_REGEX = /^[a-zA-Z\s'-]+$/;
const NAME_REGEX_MSG = 'Can only contain letters, spaces, hyphens, and apostrophes';

function normalizePhone(val: string) {
  if (val.startsWith('0')) return '+234' + val.slice(1);
  return val;
}

export const adminProfileSchema = z.object({
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters')
    .regex(NAME_REGEX, NAME_REGEX_MSG)
    .optional(),

  middle_name: z
    .string()
    .max(50, 'Middle name must be at most 50 characters')
    .regex(NAME_REGEX, NAME_REGEX_MSG)
    .optional()
    .or(z.literal('')),

  last_name: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters')
    .regex(NAME_REGEX, NAME_REGEX_MSG)
    .optional(),

  gender: z.enum(['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'] as [Gender, ...Gender[]]).optional(),

  date_of_birth: z.coerce
    .date()
    .refine((date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 16 && age <= 120;
    }, 'You must be at least 16 years old')
    .optional(),

  phone_number: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number')
    .transform(normalizePhone)
    .optional(),

  department: z
    .string()
    .max(100, 'Department must be at most 100 characters')
    .optional()
    .or(z.literal('')),

  role_title: z
    .string()
    .max(100, 'Role title must be at most 100 characters')
    .optional()
    .or(z.literal('')),
});

export type AdminProfileInput = z.infer<typeof adminProfileSchema>;
