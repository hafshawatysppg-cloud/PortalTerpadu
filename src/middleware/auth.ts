import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifySupabaseAccessToken } from '../../server/db/supabase';
import { JWT_SECRET } from '../../server/db/store';

export interface AuthenticatedUser {
  id: string;
  uid?: string;
  email?: string;
  nama?: string;
  username?: string;
  role?: string;
  [key: string]: any;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  // 1. Verify Supabase Auth JWT when Supabase is configured
  const supaUser = await verifySupabaseAccessToken(token);
  if (supaUser) {
    req.user = {
      id: supaUser.id,
      uid: supaUser.id,
      email: supaUser.email,
      nama: (supaUser.user_metadata?.nama as string) || supaUser.email || 'Pengguna Supabase',
      role: (supaUser.user_metadata?.role as string) || 'Staff',
      ...supaUser.user_metadata,
    };
    return next();
  }

  // 2. Fallback: verify Portal SSO JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
