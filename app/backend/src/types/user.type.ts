export enum UserRole {
  ADMIN = 'admin',
  VENDOR = 'vendor',
  BUYER = 'buyer',
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}