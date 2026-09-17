// src/api/auth.ts
import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  phone?: string;
}

export interface AuthResponse {
  user: any;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  session: {
    id: string;
    createdAt: string;
  };
}

export interface PhoneVerificationRequest {
  phone: string;
}

export interface PhoneVerificationResponse {
  verificationSid: string;
  expiresIn: number;
}

export interface VerifyPhoneRequest {
  phone: string;
  code: string;
}

export interface SocialLoginRequest {
  idToken: string;
  provider: 'google' | 'apple' | 'facebook';
}

class AuthAPI {
  // Email/Password Auth
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    await this.storeAuthData(response);
    return response;
  }
  
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    await this.storeAuthData(response);
    return response;
  }
  
  // Phone Auth
  async sendPhoneVerification(phone: string): Promise<PhoneVerificationResponse> {
    return apiClient.post<PhoneVerificationResponse>('/auth/phone/send-verification', { phone });
  }
  
  async verifyPhoneCode(data: VerifyPhoneRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/phone/verify', data);
    await this.storeAuthData(response);
    return response;
  }
  
  // Social Auth
  async socialLogin(data: SocialLoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/social', data);
    await this.storeAuthData(response);
    return response;
  }
  
  // Token Management
  async refreshToken(): Promise<{ accessToken: string; expiresIn: number }> {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await apiClient.post<{ accessToken: string; expiresIn: number }>('/auth/refresh', {
      refreshToken,
    });
    
    if (response.accessToken) {
      await AsyncStorage.setItem('auth_token', response.accessToken);
    }
    
    return response;
  }
  
  async logout(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      await this.clearAuthData();
    }
  }
  
  // Local Storage Helpers
  private async storeAuthData(response: AuthResponse): Promise<void> {
    const { user, tokens } = response;
    
    await AsyncStorage.multiSet([
      ['auth_token', tokens.accessToken],
      ['refresh_token', tokens.refreshToken],
      ['user_data', JSON.stringify(user)],
    ]);
    
    // Calculate token expiry
    const expiryTime = Date.now() + (tokens.expiresIn * 1000);
    await AsyncStorage.setItem('token_expiry', expiryTime.toString());
  }
  
  private async clearAuthData(): Promise<void> {
    await AsyncStorage.multiRemove([
      'auth_token',
      'refresh_token',
      'user_data',
      'token_expiry',
    ]);
  }
  
  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) return false;
    
    const expiry = await AsyncStorage.getItem('token_expiry');
    if (expiry && Date.now() > parseInt(expiry)) {
      try {
        await this.refreshToken();
        return true;
      } catch (error) {
        await this.clearAuthData();
        return false;
      }
    }
    
    return !!token;
  }
  
  // Get current user from storage
  async getCurrentUser(): Promise<any> {
    const userData = await AsyncStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
  
  // Update user in storage
  async updateStoredUser(user: any): Promise<void> {
    await AsyncStorage.setItem('user_data', JSON.stringify(user));
  }
}

export const authAPI = new AuthAPI();
export default authAPI;