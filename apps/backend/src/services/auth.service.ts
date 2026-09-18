// src/services/auth.service.ts - SIMPLIFIED WORKING VERSION
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config/env';
import prisma from '../config/database';
import { User, UserRole } from '@prisma/client';
import crypto from 'crypto';
import { smsService } from './sms.service';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: any;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export class AuthService {
  private jwtSecret = config.JWT_SECRET;
  private jwtRefreshSecret = config.JWT_REFRESH_SECRET || config.JWT_SECRET;

  private normalizePhone(phone: string): string {
    const normalized = phone.trim().replace(/[^\d+]/g, '');
    if (!/^\+[1-9]\d{6,14}$/.test(normalized)) {
      throw new Error('Enter a valid phone number with country code, such as +971501234567');
    }
    return normalized;
  }

  private hashOtp(phone: string, code: string): string {
    return crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${phone}:${code}`)
      .digest('hex')
      .slice(0, 10);
  }

  async sendPhoneSignupOtp(phone: string, name?: string): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);
    const existingUser = await prisma.user.findUnique({ where: { phone: normalizedPhone } });

    if (existingUser?.phoneVerified) {
      throw new Error('Phone number already registered');
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const verificationData = {
      name: name?.trim() || existingUser?.name || normalizedPhone,
      phoneVerificationCode: this.hashOtp(normalizedPhone, code),
      phoneVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
      authMethod: 'phone_otp',
    };

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: verificationData,
      });
    } else {
      await prisma.user.create({
        data: {
          phone: normalizedPhone,
          role: UserRole.USER,
          ...verificationData,
        },
      });
    }

    try {
      await smsService.sendVerificationCode(normalizedPhone, code);
    } catch (error) {
      await prisma.user.update({
        where: { phone: normalizedPhone },
        data: {
          phoneVerificationCode: null,
          phoneVerificationExpires: null,
        },
      });
      throw error;
    }
  }

  async verifyPhoneSignupOtp(phone: string, code: string, name?: string): Promise<AuthResponse> {
    const normalizedPhone = this.normalizePhone(phone);
    const user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    const suppliedHash = this.hashOtp(normalizedPhone, code.trim());

    if (
      !user
      || !user.phoneVerificationCode
      || !user.phoneVerificationExpires
      || user.phoneVerificationExpires.getTime() < Date.now()
      || !crypto.timingSafeEqual(
        Buffer.from(user.phoneVerificationCode),
        Buffer.from(suppliedHash)
      )
    ) {
      throw new Error('Invalid or expired verification code');
    }

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name?.trim() || user.name,
        phoneVerified: true,
        isVerified: true,
        phoneVerificationCode: null,
        phoneVerificationExpires: null,
        lastLoginAt: new Date(),
      },
    });

    return {
      user: this.sanitizeUser(verifiedUser),
      tokens: await this.generateTokens(verifiedUser),
    };
  }
  
  // Register with at least one login identifier: email address or phone number.
  async registerWithEmail(email: string | undefined, password: string, name?: string, phone?: string): Promise<AuthResponse> {
    const normalizedEmail = email?.trim().toLowerCase() || undefined;
    const normalizedPhone = phone ? this.normalizePhone(phone) : undefined;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])
        ]
      }
    });
    
    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        throw new Error('Email already registered');
      }
      if (normalizedPhone && existingUser.phone === normalizedPhone) {
        throw new Error('Phone number already registered');
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail || null,
        password: hashedPassword,
        name: name || normalizedEmail?.split('@')[0] || normalizedPhone,
        phone: normalizedPhone || null,
        role: UserRole.USER,
      }
    });
    
    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }
  
  // Login with either email address or phone number.
  async loginWithIdentifier(identifier: string, password: string): Promise<AuthResponse> {
    const value = identifier.trim();
    const normalizedEmail = value.toLowerCase();
    const normalizedPhone = value.includes('@') ? undefined : this.normalizePhone(value);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone: value },
          ...(normalizedPhone && normalizedPhone !== value ? [{ phone: normalizedPhone }] : []),
        ],
      },
    });
    
    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      }
    });
    
    const tokens = await this.generateTokens(updatedUser);
    
    return {
      user: this.sanitizeUser(updatedUser),
      tokens,
    };
  }

  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    return this.loginWithIdentifier(email, password);
  }
  
  // Generate tokens
  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email || '', // Handle null email
      role: user.role,
    };
    
    // Generate access token
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '15m',
    });
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      this.jwtRefreshSecret,
      { expiresIn: '7d' }
    );
    
    // Store refresh token in database (optional for now)
    // await prisma.refreshToken.create({
    //   data: {
    //     userId: user.id,
    //     token: refreshToken,
    //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    //   }
    // });
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }
  
  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as { userId: string; type: string };
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate new access token
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email || '',
        role: user.role,
      };
      
      const accessToken = jwt.sign(payload, this.jwtSecret, {
        expiresIn: '15m',
      });
      
      return {
        accessToken,
        expiresIn: 15 * 60,
      };
    } catch (error: any) {
      throw new Error('Invalid refresh token');
    }
  }
  
  // Logout
  async logout(userId: string, _refreshToken?: string): Promise<void> {
    // For now, just log the logout
    console.log(`User ${userId} logged out`);

    // Update user last active
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() }
    });
  }
  
  // Validate token
  async validateToken(token: string): Promise<JwtPayload> {
    return jwt.verify(token, this.jwtSecret) as JwtPayload;
  }
  
  // Helper methods
  private sanitizeUser(user: User): any {
    const {
      password,
      phoneVerificationCode,
      phoneVerificationExpires,
      ...safeUser
    } = user;
    return safeUser;
  }
  
  // Update interests
  async updateInterests(userId: string, interests: string[]): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        interests: interests as any, // Cast to Prisma JsonValue
        updatedAt: new Date(),
      }
    });
    
    return user;
  }
}

export const authService = new AuthService();