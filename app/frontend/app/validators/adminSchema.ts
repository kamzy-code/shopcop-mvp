import { z } from 'zod';

const NAME_REGEX = /^[a-zA-Z\s'-]+$/;
const NAME_REGEX_MSG = 'Can only contain letters, spaces, hyphens, and apostrophes';

export const adminProfileSchema = z.object({
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters')
    .regex(NAME_REGEX, NAME_REGEX_MSG)
    .optional()
    .or(z.literal('')),

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
    .optional()
    .or(z.literal('')),

  gender: z.enum(['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY']).optional(),

  date_of_birth: z.string().optional().or(z.literal('')),

  phone_number: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number')
    .optional()
    .or(z.literal('')),

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

export type AdminProfileFormData = z.infer<typeof adminProfileSchema>;
