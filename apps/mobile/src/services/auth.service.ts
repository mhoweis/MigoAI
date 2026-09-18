import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string | null;
  name: string;
  phone?: string | null;
  avatar?: string;
  role: string;
  interests: string[];
  preferences?: {
    notifications: boolean;
    location: string;
    theme: 'light' | 'dark';
  };
  createdAt: string;
  updatedAt: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  isFirstLogin: boolean;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const authService = {
  async sendPhoneSignupOtp(data: { phone: string; name?: string }): Promise<void> {
    try {
      await api.post('/auth/phone-signup/send-otp', data);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || error.message || 'Failed to send verification code'
      );
    }
  },

  async verifyPhoneSignupOtp(data: {
    phone: string;
    code: string;
    name?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>(
        '/auth/phone-signup/verify-otp',
        data
      );
      const { user, tokens, isFirstLogin } = response.data.data;

      await AsyncStorage.setItem('accessToken', tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('firstLogin', JSON.stringify(isFirstLogin));
      api.defaults.headers.common.Authorization = `Bearer ${tokens.accessToken}`;

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || error.message || 'Verification failed'
      );
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Login failed');
      }
      
      const { user, tokens, isFirstLogin } = response.data.data;
      
      // Store tokens and user data
      await AsyncStorage.setItem('accessToken', tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('firstLogin', JSON.stringify(isFirstLogin));
      
      // Update API default headers with new token
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
      
      return response.data.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        'Login failed'
      );
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Registration failed');
      }
      
      const { user, tokens, isFirstLogin } = response.data.data;
      
      await AsyncStorage.setItem('accessToken', tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('firstLogin', JSON.stringify(isFirstLogin));
      
      // Update API default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
      
      return response.data.data;
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        'Registration failed'
      );
    }
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (refreshToken) {
        await api.post<ApiResponse<{ message: string }>>('/auth/logout', { 
          refreshToken 
        });
      }
      
      // Clear all stored data
      await AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'user',
        'firstLogin',
      ]);
      
      // Remove authorization header
      delete api.defaults.headers.common['Authorization'];
      
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local storage
      await AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'user',
        'firstLogin',
      ]);
      delete api.defaults.headers.common['Authorization'];
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>('/auth/me');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch user');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Get user error:', error);
      throw error;
    }
  },

  async updateInterests(interests: string[]): Promise<User> {
    try {
      const response = await api.put<ApiResponse<User>>('/auth/interests', { interests });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update interests');
      }
      
      const updatedUser = response.data.data;
      
      // Update stored user and set firstLogin to false
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await AsyncStorage.setItem('firstLogin', JSON.stringify(false));
      
      return updatedUser;
    } catch (error: any) {
      console.error('Update interests error:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        'Failed to update interests'
      );
    }
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await api.put<ApiResponse<User>>('/auth/profile', data);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update profile');
      }
      
      const updatedUser = response.data.data;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        'Failed to update profile'
      );
    }
  },

  async refreshAccessToken(): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post<ApiResponse<{ accessToken: string; expiresIn: number }>>(
        '/auth/refresh-token',
        { refreshToken }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Token refresh failed');
      }
      
      const { accessToken, expiresIn } = response.data.data;
      
      // Store new access token
      await AsyncStorage.setItem('accessToken', accessToken);
      
      // Update API default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      return { accessToken, expiresIn };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  async socialLogin(idToken: string, provider: 'google' | 'apple' | 'facebook'): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/social-login', {
        idToken,
        provider,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Social login failed');
      }
      
      const { user, tokens, isFirstLogin } = response.data.data;
      
      await AsyncStorage.setItem('accessToken', tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('firstLogin', JSON.stringify(isFirstLogin));
      
      // Update API default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
      
      return response.data.data;
    } catch (error: any) {
      console.error('Social login error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        'Social login failed'
      );
    }
  },

  // Initialize API with stored token
  async initializeApiToken(): Promise<void> {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      if (accessToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.error('Failed to initialize API token:', error);
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      return !!(accessToken && refreshToken);
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  },

  // Get stored tokens
  async getStoredTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('refreshToken'),
      ]);
      
      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Failed to get stored tokens:', error);
      return { accessToken: null, refreshToken: null };
    }
  },
};