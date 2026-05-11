import { UserRole } from "generated/prisma/enums.js";
export interface JWTPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}