export function parseZodErrors(errors: { path: (string | number | symbol)[]; message: string }[]): string {
  return errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
}