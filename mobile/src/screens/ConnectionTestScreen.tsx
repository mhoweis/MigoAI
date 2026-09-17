// src/screens/ConnectionTestScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { testBackendConnection } from '../services/api';
import { getApiBaseUrl } from '../config';

const ConnectionTestScreen = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setApiUrl(getApiBaseUrl());
    
    const result = await testBackendConnection();
    
    setConnectionInfo(result);
    setConnectionStatus(result.success ? 'success' : 'error');
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      default: return 'sync';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="wifi" size={48} color="#3b82f6" />
          <Text style={styles.title}>Backend Connection Test</Text>
          <Text style={styles.subtitle}>Testing connection to your backend server</Text>
        </View>

        <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
          <View style={styles.statusHeader}>
            <Ionicons name={getStatusIcon()} size={24} color={getStatusColor()} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {connectionStatus.toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.statusDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>API URL:</Text>
              <Text style={styles.detailValue}>{apiUrl}</Text>
            </View>
            
            {connectionInfo?.success && connectionInfo.data && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailValue}>{connectionInfo.data.status}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Message:</Text>
                  <Text style={styles.detailValue}>{connectionInfo.data.message}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Environment:</Text>
                  <Text style={styles.detailValue}>{connectionInfo.data.environment}</Text>
                </View>
              </>
            )}
            
            {connectionInfo?.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Connection Error:</Text>
                <Text style={styles.errorText}>{connectionInfo.error}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.troubleshooting}>
          <Text style={styles.troubleshootingTitle}>Troubleshooting Steps:</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Check Backend Server</Text>
              <Text style={styles.stepDescription}>
                Make sure your Node.js backend is running on port 5000
              </Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Verify IP Address</Text>
              <Text style={styles.stepDescription}>
                For physical device testing, use your computer's IP address
              </Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Check CORS Settings</Text>
              <Text style={styles.stepDescription}>
                Ensure backend CORS allows your mobile app's origin
              </Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Test in Browser</Text>
              <Text style={styles.stepDescription}>
                Open {apiUrl}/api/health in your browser to test
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.testButton} onPress={testConnection}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.testButtonText}>Test Connection Again</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    marginBottom: 32,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 14,
    color: '#991b1b',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#991b1b',
  },
  troubleshooting: {
    marginBottom: 32,
  },
  troubleshootingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ConnectionTestScreen;