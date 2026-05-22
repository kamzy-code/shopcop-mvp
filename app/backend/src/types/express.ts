import { UserRole } from "../generated/prisma/enums.js";

/**
 * Extend the Express Request type to include the authenticated user.
 * Populated by the `authenticate` middleware after JWT verification.
 */
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      email: string;
      role: UserRole;
    };
  }
}