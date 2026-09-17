import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import logger from '../utils/logger';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class JWTService {
  private readonly secret: string;
  private readonly refreshSecret: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'your-secret-key';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    const refreshToken = jwt.sign(payload, this.refreshSecret, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    // Store refresh token in database
    this.storeRefreshToken(payload.userId, refreshToken).catch(error => {
      logger.error('Failed to store refresh token:', error);
    });

    return refreshToken;
  }

  async storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.secret) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      // Check if token exists and is not revoked
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          token,
          revoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!storedToken) {
        return null;
      }

      const payload = jwt.verify(token, this.refreshSecret) as TokenPayload;
      return payload;
    } catch (error) {
      return null;
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { revoked: true },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  }
}

export const jwtService = new JWTService();