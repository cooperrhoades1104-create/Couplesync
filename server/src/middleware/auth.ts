import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface AuthRequest extends Request {
  userId?: string;
  coupleId?: string;
}

// Clerk JWKS URL — uses the publishable key to derive the issuer
const CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY || '';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';

// Derive issuer from publishable key
// Clerk issuer format: https://{instance}.clerk.accounts.dev
function getIssuer(): string {
  if (!CLERK_PUBLISHABLE_KEY) return '';
  // publishable key format: pk_live_XXXXXXXXX or pk_test_XXXXXXXXX
  const parts = CLERK_PUBLISHABLE_KEY.split('_');
  if (parts.length >= 3) {
    return `https://${parts.slice(2).join('_')}.clerk.accounts.dev`;
  }
  return '';
}

const issuer = getIssuer();

// JWKS endpoint for Clerk
const JWKS_URL = issuer ? new URL(`${issuer}/.well-known/jwks.json`) : null;
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

if (JWKS_URL) {
  jwks = createRemoteJWKSet(JWKS_URL);
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (!jwks) {
    // Dev/dev fallback: parse token without verification
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
      req.userId = payload.sub;
      req.coupleId = payload.couple_id || null;
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid token format' });
    }
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: issuer,
    });

    req.userId = payload.sub as string;
    req.coupleId = (payload as any).couple_id || null;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}