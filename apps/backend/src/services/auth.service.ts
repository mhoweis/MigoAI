// src/services/auth.service.ts - SIMPLIFIED WORKING VERSION
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config/env';
import prisma from '../config/database';
import { User, UserRole } from '@prisma/client';

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
  
  // Register with email
  async registerWithEmail(email: string, password: string, name?: string, phone?: string): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : [])
        ]
      }
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email already registered');
      }
      if (phone && existingUser.phone === phone) {
        throw new Error('Phone number already registered');
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        phone: phone || null,
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
  
  // Login with email
  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
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
    const { password, ...safeUser } = user;
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