import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../services/auth.service';
import { useUserStore } from '../store/userStore';

type SignupMode = 'phone' | 'email';

const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [mode, setMode] = useState<SignupMode>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { setUser, setFirstLogin } = useUserStore();

  const showError = (message: string) => {
    setErrorMessage(message);
    Alert.alert('Signup failed', message);
  };

  const finishSignup = (response: Awaited<ReturnType<typeof authService.register>>) => {
    setUser(response.user);
    setFirstLogin(response.isFirstLogin);
  };

  const switchMode = (nextMode: SignupMode) => {
    setMode(nextMode);
    setErrorMessage(null);
    setOtp('');
    setOtpSent(false);
  };

  const sendOtp = async () => {
    if (!name.trim()) return showError('Please enter your full name');
    if (!/^\+[1-9]\d{6,14}$/.test(phone.replace(/[\s()-]/g, ''))) {
      return showError('Enter your phone number with country code, such as +971501234567');
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await authService.sendPhoneSignupOtp({ phone, name: name.trim() });
      setOtpSent(true);
      Alert.alert('Code sent', 'Enter the 6-digit code sent to your phone.');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) return showError('Enter the 6-digit verification code');

    setLoading(true);
    setErrorMessage(null);
    try {
      finishSignup(await authService.verifyPhoneSignupOtp({
        phone,
        code: otp.trim(),
        name: name.trim(),
      }));
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async () => {
    if (!name.trim()) return showError('Please enter your full name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return showError('Please enter a valid email address');
    }
    if (password.length < 6) return showError('Password must be at least 6 characters');
    if (password !== confirmPassword) return showError('Passwords do not match');

    setLoading(true);
    setErrorMessage(null);
    try {
      finishSignup(await authService.register({
        email: email.trim(),
        password,
        name: name.trim(),
      }));
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Migo to discover amazing events</Text>
          </View>

          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'phone' && styles.modeButtonActive]}
              onPress={() => switchMode('phone')}
            >
              <Text style={[styles.modeText, mode === 'phone' && styles.modeTextActive]}>
                Phone & OTP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'email' && styles.modeButtonActive]}
              onPress={() => switchMode('email')}
            >
              <Text style={[styles.modeText, mode === 'email' && styles.modeTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

          {mode === 'phone' ? (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Phone number, e.g. +971501234567"
                  value={phone}
                  onChangeText={(value) => {
                    setPhone(value);
                    if (otpSent) {
                      setOtpSent(false);
                      setOtp('');
                    }
                  }}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  editable={!loading}
                />
              </View>
              {otpSent && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit verification code"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoComplete="sms-otp"
                    textContentType="oneTimeCode"
                  />
                </View>
              )}
              <Text style={styles.hint}>
                {otpSent
                  ? 'The code expires in 10 minutes.'
                  : 'No password needed. We will text you a verification code.'}
              </Text>
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={otpSent ? verifyOtp : sendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {otpSent ? 'Verify & Create Account' : 'Send Verification Code'}
                  </Text>
                )}
              </TouchableOpacity>
              {otpSent && (
                <TouchableOpacity onPress={sendOtp} disabled={loading}>
                  <Text style={styles.resendText}>Send a new code</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
                <TouchableOpacity onPress={() => setShowPassword(value => !value)}>
                  <Image
                    source={require('../../assets/icons/show-password.png')}
                    style={styles.showPassword}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
              </View>
              <Text style={styles.hint}>Password must be at least 6 characters.</Text>
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={registerWithEmail}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Create Account with Email</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}

          <Text style={styles.termsText}>
            By creating an account, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
          <View style={styles.loginRow}>
            <Text style={styles.secondaryText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingBottom: 36 },
  header: { marginTop: 24, marginBottom: 28, alignItems: 'center' },
  logo: { width: 64, height: 64, marginBottom: 14 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 9 },
  modeButtonActive: { backgroundColor: '#fff' },
  modeText: { color: '#6b7280', fontWeight: '600' },
  modeTextActive: { color: '#2563eb' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: { flex: 1, height: 56, fontSize: 16, color: '#111827' },
  showPassword: { width: 20, height: 20 },
  hint: { color: '#6b7280', fontSize: 12, marginBottom: 18 },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { backgroundColor: '#93c5fd' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resendText: { color: '#2563eb', textAlign: 'center', fontWeight: '600', marginBottom: 18 },
  errorMessage: { color: '#dc2626', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  termsText: { color: '#6b7280', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  link: { color: '#2563eb', fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  secondaryText: { color: '#6b7280', fontSize: 14 },
});

export default RegisterScreen;