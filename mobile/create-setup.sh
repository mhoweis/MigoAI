#!/bin/bash

echo "🔧 Setting up backend connection..."

# Get IP address (Mac specific)
IP_ADDRESS=$(ipconfig getifaddr en0 2>/dev/null || echo "192.168.1.100")

echo "📱 Detected IP Address: $IP_ADDRESS"

# Create config file
cat > src/config/index.ts << CONFIG
import { Platform } from 'react-native';

export const API_CONFIG = {
  // For Android emulator
  ANDROID_EMULATOR: 'http://10.0.2.2:5000',
  
  // For iOS simulator
  IOS_SIMULATOR: 'http://localhost:5000',
  
  // For physical device (uses your computer's actual IP)
  PHYSICAL_DEVICE: 'http://${IP_ADDRESS}:5000',
  
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
CONFIG

echo "✅ Created config file at src/config/index.ts"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your backend is running on port 5000"
echo "2. Update backend CORS to allow connections from your IP"
echo "3. Run: npm start"
echo ""
echo "💡 For physical device testing:"
echo "   - Connect device to same WiFi as your computer"
echo "   - Use IP address: $IP_ADDRESS"
