// src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: any[];
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:5000/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token if available
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request ID for tracking
        config.headers['X-Request-ID'] = Date.now().toString();
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired - attempt refresh
          const refreshToken = await AsyncStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const newTokens = await this.refreshToken(refreshToken);
              if (newTokens) {
                // Retry original request
                error.config.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                return this.client.request(error.config);
              }
            } catch (refreshError) {
              // Refresh failed - clear storage and redirect to login
              await this.clearAuth();
              // You might want to emit an event or use navigation here
            }
          }
        }
        
        return Promise.reject(this.formatError(error));
      }
    );
  }
  
  private async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/refresh`, {
        refreshToken,
      });
      
      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        await AsyncStorage.setItem('auth_token', accessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refresh_token', newRefreshToken);
        }
        
        return { accessToken, refreshToken: newRefreshToken };
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return null;
  }
  
  private async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
    // Emit logout event or navigate to login
  }
  
  private formatError(error: any): ApiError {
    if (error.response) {
      // Server responded with error
      return {
        status: error.response.status,
        message: error.response.data?.message || 'Server error',
        errors: error.response.data?.errors,
      };
    } else if (error.request) {
      // No response received
      return {
        status: 0,
        message: 'Network error. Please check your connection.',
      };
    } else {
      // Request setup error
      return {
        status: 500,
        message: error.message || 'Unknown error',
      };
    }
  }
  
  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, config);
    return this.handleResponse(response);
  }
  
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data, config);
    return this.handleResponse(response);
  }
  
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data, config);
    return this.handleResponse(response);
  }
  
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(url, data, config);
    return this.handleResponse(response);
  }
  
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url, config);
    return this.handleResponse(response);
  }
  
  private handleResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
    if (response.data.success) {
      return response.data.data as T;
    } else {
      throw {
        status: response.status,
        message: response.data.message || 'Request failed',
        errors: response.data.error,
      };
    }
  }
  
  // File upload helper
  async uploadFile(url: string, file: any, fieldName: string = 'file', onProgress?: (progress: number) => void): Promise<any> {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    
    return this.handleResponse(response);
  }
  
  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;