// src/screens/RegisterScreen.tsx - UPDATED
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../store/userStore';
import { authService } from '../services/auth.service';

interface Props {
  navigation: any;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser, setFirstLogin } = useUserStore();

  const handleInputChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Call real API
      const response = await authService.register({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone || undefined,
      });

      console.log('✅ Registration successful:', response.user.email);
      console.log('📝 First login status:', response.isFirstLogin);

      // Update user store with real data from backend
      // App.tsx will automatically navigate based on firstLogin state
      setUser(response.user);
      setFirstLogin(response.isFirstLogin);

      // Navigation will be handled automatically by App.tsx:
      // - If isFirstLogin is true → Interests screen
      // - If isFirstLogin is false → Main screen

    } catch (error: any) {
      console.error('❌ Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Failed to create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
            <Image 
              source={require('../../assets/icons/back.png')}
              style={styles.backButton}
              resizeMode="contain"
            />
             {/* <Icon name="arrow-back" size={24} color="#374151" />*/}
            </TouchableOpacity>
            
            {/* Added: Logo */}
            <Image 
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Migo to discover amazing events</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              {/*<Icon name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />*/}
              <TextInput
                style={styles.input}
                placeholder="Full name *"
                value={form.name}
                onChangeText={(value) => handleInputChange('name', value)}
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                editable={true}
              />
            </View>

            <View style={styles.inputContainer}>
              {/*<Icon name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />*/}
              <TextInput
                style={styles.input}
                placeholder="Email address *"
                value={form.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                editable={true}
              />
            </View>

            <View style={styles.inputContainer}>
             {/* <Icon name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />*/}
              <TextInput
                style={styles.input}
                placeholder="Phone number (optional)"
                value={form.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                returnKeyType="next"
                editable={true}
              />
            </View>

            <View style={styles.inputContainer}>
              {/*<Icon name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />*/}
              <TextInput
                style={styles.input}
                placeholder="Password *"
                value={form.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                textContentType="newPassword"
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Image
                  source={require('../../assets/icons/show-password.png')}
                  style={styles.showPassword}
                  resizeMode="contain"
                />
                {/*<Icon
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9ca3af"
                />*/}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              {/*<Icon name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />*/}
              <TextInput
                style={styles.input}
                placeholder="Confirm password *"
                value={form.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                textContentType="newPassword"
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Image
                  source={require('../../assets/icons/show-password.png')}
                  style={styles.showPassword}
                  resizeMode="contain"
                  />
                {/*<Icon
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9ca3af"
                />*/}
              </TouchableOpacity>
            </View>

            <Text style={styles.passwordHint}>
              Password must be at least 6 characters
            </Text>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
  },
  passwordHint: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 24,
  },
  showPassword: {
    width: 20,
    height: 20,
  },
  registerButton: {
    backgroundColor: '#3b82f6',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  registerButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsContainer: {
    marginBottom: 32,
  },
  termsText: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  loginLinkText: {
    color: '#6b7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;