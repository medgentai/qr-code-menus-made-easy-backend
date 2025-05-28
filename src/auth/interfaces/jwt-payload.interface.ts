export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  sessionId?: string; // Session ID
  iat?: number; // Issued at
  exp?: number; // Expiration time
}
