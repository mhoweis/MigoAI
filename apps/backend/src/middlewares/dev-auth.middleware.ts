// src/middlewares/dev-auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

// Middleware: tries to authenticate via JWT. Falls back to a test user in development.
export const devAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = await authService.validateToken(token);
      (req as any).user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      return next();
    } catch {
      // Token invalid — fall through to dev fallback
    }
  }

  // Development fallback: use test user so AI routes can be tested without auth
  (req as any).user = {
    id: 'test_user_123',
    email: 'test@migo.ai',
    name: 'Test User',
    displayName: 'Migo Tester',
    role: 'USER',
  };
  next();
};
