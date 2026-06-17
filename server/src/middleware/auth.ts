import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'couplesync-dev-secret-change-in-production';

export interface AuthRequest extends Request {
  userId?: string;
  coupleId?: string;
}

export function generateToken(userId: string, coupleId: string | null): string {
  return jwt.sign({ userId, coupleId }, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; coupleId: string | null };
    req.userId = decoded.userId;
    req.coupleId = decoded.coupleId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}