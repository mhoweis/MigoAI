// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { createSuccessResponse, createErrorResponse, HTTP_STATUS, ErrorCode } from '@migo/shared';
import logger from '../utils/logger';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name, phone } = req.body;
      
      const result = await authService.register(email, password, name, phone);
      
      return res.status(HTTP_STATUS.CREATED).json(createSuccessResponse(result, 'Registration successful'));
    } catch (error: any) {
      logger.error('Registration error:', error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login(email, password);
      
      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({
        user: result.user,
        accessToken: result.accessToken,
      }, 'Login successful'));
    } catch (error: any) {
      logger.error('Login error:', error);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(createErrorResponse(ErrorCode.INVALID_CREDENTIALS, error.message, HTTP_STATUS.UNAUTHORIZED));
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json(createErrorResponse(ErrorCode.TOKEN_INVALID, 'Refresh token required', HTTP_STATUS.UNAUTHORIZED));
      }
      
      const result = await authService.refreshToken(refreshToken);
      
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(result, 'Token refreshed'));
    } catch (error: any) {
      logger.error('Refresh token error:', error);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(createErrorResponse(ErrorCode.INVALID_CREDENTIALS, error.message, HTTP_STATUS.UNAUTHORIZED));
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      // Clear cookie
      res.clearCookie('refreshToken');
      
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'Logout successful'));
    } catch (error: any) {
      logger.error('Logout error:', error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { oldPassword, newPassword } = req.body;
      
      await authService.changePassword(userId, oldPassword, newPassword);
      
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'Password changed successfully'));
    } catch (error: any) {
      logger.error('Change password error:', error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  // Other methods: verifyEmail, requestPasswordReset, resetPassword, social auth, etc.
  async googleAuth(req: Request, res: Response) {
    // Implement Google auth
  }

  async appleAuth(req: Request, res: Response) {
    // Implement Apple auth
  }

  async facebookAuth(req: Request, res: Response) {
    // Implement Facebook auth
  }

  async sendPhoneVerification(req: Request, res: Response) {
    // Implement phone verification
  }

  async verifyPhone(req: Request, res: Response) {
    // Implement phone verification
  }
}

export const authController = new AuthController();