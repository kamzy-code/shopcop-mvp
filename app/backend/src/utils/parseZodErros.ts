/**
 * Converts a Zod error issues array into a human-readable string.
 *
 * @param errors - Array of Zod issue objects containing path and message
 * @returns Semicolon-separated string of "field.path: message" entries
 */
export function parseZodErrors(errors: { path: (string | number | symbol)[]; message: string }[]): string {
  return errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
}