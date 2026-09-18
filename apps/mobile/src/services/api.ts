import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants'; // Optional: if using Expo

// Get the machine's IP address for physical device testing
let MACHINE_IP = '192.168.12.33';

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

// Platform-specific base URL configuration
const getApiBaseUrl = (): string => {
  // Expo web proxies /api to the backend so browser requests stay same-origin.
  if (Platform.OS === 'web') {
    return '';
  }

  // Replit and other hosted previews inject the API URL at build time.
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl;
  }

  // Production URL (when app is deployed)
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.migoapp.com'; // Your production API URL
  }

  // Development URLs based on platform
  if (__DEV__) {
    // For iOS Simulator
    if (Platform.OS === 'ios') {
      // Check if running in iOS Simulator (you can use Platform.isTV or other checks)
      // For simplicity, we'll assume localhost works for iOS simulator
      return 'http://localhost:5001';
    }
    
    // For Android Emulator
    if (Platform.OS === 'android') {
      // Standard Android emulator uses 10.0.2.2
      return 'http://10.0.2.2:5001';
    }
    
    // For physical devices (Android/iOS) - use machine IP
    // Note: Both devices must be on same WiFi network
    return `http://${MACHINE_IP}:5000`;
  }
  
  // Fallback
  return 'http://localhost:5001';
};

// Test function to help developers find the right IP
export const detectAndSetMachineIP = async (): Promise<string> => {
  try {
    // Try to auto-detect IP using a service (optional)
    const response = await axios.get('https://api.ipify.org?format=json');
    const publicIP = response.data.ip;
    
    // Note: Public IP might not work for local development
    // This is just for informational purposes
    console.log('Your public IP:', publicIP);
    
    // Show alert with instructions
    Alert.alert(
      'Network Configuration',
      `For physical device testing:
      1. Ensure phone and computer are on same WiFi
      2. Find your computer's local IP (ipconfig / ifconfig)
      3. Update MACHINE_IP in api.ts
      
      Current MACHINE_IP: ${MACHINE_IP}
      Detected Public IP: ${publicIP}`,
      [{ text: 'OK' }]
    );
    
    return publicIP;
  } catch (error) {
    console.warn('Could not detect public IP:', error);
    return MACHINE_IP;
  }
};

const API_BASE_URL = getApiBaseUrl();

console.log(`[API Config] Platform: ${Platform.OS}, API Base URL: ${API_BASE_URL || '(same origin)'}`);

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000, // Increased timeout for mobile networks
  headers: {
    'Content-Type': 'application/json',
    'X-Platform': Platform.OS,
    'X-App-Version': Constants?.expoConfig?.version || '1.0.0',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for debugging
    config.headers['X-Request-ID'] = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('[API Response Error]', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    
    const originalRequest = error.config;
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh token endpoint
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
          refreshToken,
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        await AsyncStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
        }
        
        // Update the original request header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout the user
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        
        // You might want to redirect to login screen here
        console.log('Session expired, please login again');
        
        // Emit event or use navigation ref to redirect
        // For now, we'll reject
        return Promise.reject(refreshError);
      }
    }
    
    // Handle network errors
    if (!error.response) {
      throw new Error(`Network error: Cannot reach server at ${API_BASE_URL}. Check your connection.`);
    }
    
    return Promise.reject(error);
  }
);

// Helper to test connection
export const testBackendConnection = async () => {
  console.log(`[Connection Test] Testing connection to: ${API_BASE_URL}`);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`, {
      timeout: 10000,
    });
    
    console.log('[Connection Test] Success:', response.data);
    
    return {
      success: true,
      data: response.data,
      url: API_BASE_URL,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('[Connection Test] Failed:', error.message);
    
    return {
      success: false,
      error: error.message,
      url: API_BASE_URL,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      suggestions: [
        'Check if backend server is running (npm run dev)',
        `Verify ${Platform.OS} is using correct base URL`,
        'Ensure firewall is not blocking port 5000',
        'For physical device: check WiFi and update MACHINE_IP variable',
      ],
    };
  }
};

// Export for debugging
export { API_BASE_URL, MACHINE_IP };