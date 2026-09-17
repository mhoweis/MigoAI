// src/middlewares/auth.middleware.ts - UPDATED with additional exports
import { Request, Response, NextFunction } from "express";
import { authService, JwtPayload } from "../services/auth.service";
import config from "../config/env";

// Extend Express Request type
export interface AuthRequest extends Request {
  user?: JwtPayload;
  userId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "No token provided",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Check if JWT secret is configured
    if (!config.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      res.status(500).json({
        success: false,
        error: "Server configuration error",
      });
      return;
    }

    // Use authService to validate token (centralized validation)
    const decoded = await authService.validateToken(token);

    // Attach user to request
    req.user = decoded;
    req.userId = decoded.userId;

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        error: "Token expired",
      });
    } else if (error.name === "JsonWebTokenError") {
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    } else {
      res.status(401).json({
        success: false,
        error: "Authentication failed",
      });
    }
  }
};

// Role-based middleware that uses our new JWT payload structure
export const requireRoles = (roles: string | string[]) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    // Check if user has required role
    const hasRequiredRole = roleArray.includes(req.user.role);

    if (!hasRequiredRole) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

// Convenience middleware for common roles
export const requirePremium = requireRoles(["PREMIUM", "ADMIN"]);
export const requireOrganizer = requireRoles(["ORGANIZER", "ADMIN"]);
export const requireAdmin = requireRoles(["ADMIN"]);

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      if (config.JWT_SECRET) {
        const decoded = await authService.validateToken(token);
        req.user = decoded;
        req.userId = decoded.userId;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional authentication
    next();
  }
};

// Alias exports for compatibility with existing code
export const authorize = requireRoles; // Alias for requireRoles
export const authMiddleware = authenticate; // Alias for authenticate
export const adminMiddleware = requireAdmin; // Alias for requireAdmin
export const organizerMiddleware = requireOrganizer; // Alias for requireOrganizer
