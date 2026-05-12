import { UserRole } from "generated/prisma/enums.js";

// Extend Express Request type to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      email: string;
      role: UserRole;
    };
  }
}