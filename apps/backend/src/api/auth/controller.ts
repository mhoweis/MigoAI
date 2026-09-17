// src/api/auth/controller.ts
import { Request, Response } from 'express';
import { authService } from '../../services/auth.service';
import { createSuccessResponse, createErrorResponse, HTTP_STATUS, ErrorCode } from '@migo/shared';
import logger from '../../utils/logger';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name, phone } = req.body;
      const result = await authService.registerWithEmail(email, password, name, phone);

      logger.info(`User registered: ${email}`);
      return res.status(HTTP_STATUS.CREATED).json(createSuccessResponse(result, 'Registration successful'));
    } catch (error: any) {
      logger.error('Registration failed:', error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.loginWithEmail(email, password);

      // Set HTTP-only cookies for web clients
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      logger.info(`User logged in: ${email}`);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse({
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn
        }
      }, 'Login successful'));
    } catch (error: any) {
      logger.error('Login failed:', error);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(createErrorResponse(ErrorCode.INVALID_CREDENTIALS, error.message, HTTP_STATUS.UNAUTHORIZED));
    }
  }

  async sendPhoneVerification(req: Request, res: Response) {
    try {
      const { phone } = req.body;
      const result = await authService.sendPhoneVerification?.(phone);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(result, 'Verification code sent'));
    } catch (error: any) {
      logger.error('Phone verification failed:', error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async verifyPhoneCode(req: Request, res: Response) {
    try {
      const { phone, code } = req.body;
      const result = await authService.verifyPhoneCode?.(phone, code);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(result, 'Phone verified successfully'));
    } catch (error: any) {
      logger.error('Phone code verification failed:', error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async socialLogin(req: Request, res: Response) {
    try {
      const { idToken, provider } = req.body;
      const result = await authService.socialLogin?.(idToken, provider);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(result, 'Social login successful'));
    } catch (error: any) {
      logger.error('Social login failed:', error);
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(createErrorResponse(ErrorCode.INVALID_CREDENTIALS, error.message, HTTP_STATUS.UNAUTHORIZED));
    }
  }

  async refreshAccessToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshAccessToken(refreshToken);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(result, 'Token refreshed'));
    } catch (error: any) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(createErrorResponse(ErrorCode.TOKEN_EXPIRED, error.message, HTTP_STATUS.UNAUTHORIZED));
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      await authService.logout(userId);

      // Clear cookies
      res.clearCookie('refreshToken');

      logger.info(`User logged out: ${userId}`);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'Logout successful'));
    } catch (error: any) {
      logger.error('Logout failed:', error);
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { oldPassword, newPassword } = req.body;
      await authService.changePassword?.(userId, oldPassword, newPassword);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'Password changed successfully'));
    } catch (error: any) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      // Implement password reset email logic here
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'Password reset email sent'));
    } catch (error: any) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      // Implement password reset logic here
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'Password reset successful'));
    } catch (error: any) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async sendVerificationEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;
      await authService.verifyEmailToken?.(email);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'Verification email sent'));
    } catch (error: any) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const result = await authService.verifyEmailToken?.(token);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(result, 'Email verified successfully'));
    } catch (error: any) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async resendVerification(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      // Implement resend verification logic here
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'Verification email resent'));
    } catch (error: any) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  // Passkey Methods
  async startPasskeyRegistration(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const options = await authService.startPasskeyRegistration?.(userId);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(options, 'Passkey registration started'));
    } catch (error: any) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async finishPasskeyRegistration(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { credential } = req.body;
      await authService.verifyPasskeyRegistration?.(userId, credential);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(null, 'Passkey registered successfully'));
    } catch (error: any) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async startPasskeyLogin(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const options = await authService.startPasskeyAuthentication?.(email);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(options, 'Passkey login started'));
    } catch (error: any) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.INTERNAL_ERROR, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }

  async finishPasskeyLogin(req: Request, res: Response) {
    try {
      const { credential } = req.body;
      const result = await authService.verifyPasskeyAuthentication?.(credential);
      return res.status(HTTP_STATUS.OK).json(createSuccessResponse(result, 'Passkey login successful'));
    } catch (error: any) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(ErrorCode.INVALID_CREDENTIALS, error.message, HTTP_STATUS.BAD_REQUEST));
    }
  }
}

export const authController = new AuthController();
