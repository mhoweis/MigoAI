import { Platform } from 'react-native';

export const API_CONFIG = {
  // For Android emulator
  ANDROID_EMULATOR: 'http://10.0.2.2:5000',
  
  // For iOS simulator
  IOS_SIMULATOR: 'http://localhost:5000',
  
  // For physical device (uses your computer's actual IP)
  PHYSICAL_DEVICE: 'http://192.168.12.33:5000',
  
  // Production URL
  PRODUCTION: 'https://api.yourdomain.com',
};

// Detect platform and return appropriate URL
export const getApiBaseUrl = () => {
  if (__DEV__) {
    // If you are testing on a physical phone, you might want to force PHYSICAL_DEVICE
    if (Platform.OS === 'android') {
      return API_CONFIG.ANDROID_EMULATOR;
    } else if (Platform.OS === 'ios') {
      return API_CONFIG.IOS_SIMULATOR;
    }
    return API_CONFIG.PHYSICAL_DEVICE;
  }
  return API_CONFIG.PRODUCTION;
};
