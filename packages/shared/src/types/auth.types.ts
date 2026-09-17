/**
 * Authentication types
 */
import { User } from './user.types';
import { AuthProvider } from '../constants';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  firstLogin?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  phone?: string;
  acceptTerms: boolean;
}

export interface SocialAuthCredentials {
  provider: AuthProvider;
  idToken: string;
}

export interface PasswordReset {
  password: string;
  confirmPassword: string;
  token?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
