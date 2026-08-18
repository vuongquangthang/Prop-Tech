import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { secureStorage } from '../utils/secureStorage';
import { useEffect } from 'react';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthStack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const REMEMBER_LOGIN_KEY = 'remember_login';
const REMEMBERED_PHONE_KEY = 'remembered_phone';
const TEMP_LOCK_MESSAGE = 'Tài khoản bị khóa tạm thời 15 phút do nhập sai quá 5 lần';
const TEMP_LOCK_DURATION_MS = 15 * 60 * 1000;

export default function LoginScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const { login, isLoading, error, clearError } = useAuthStore();
  const isTemporarilyLocked = lockExpiresAt !== null && lockExpiresAt > Date.now();

  useEffect(() => {
    let isMounted = true;

    const loadRememberedLogin = async () => {
      const [remembered, savedPhone] = await Promise.all([
        secureStorage.getItemAsync(REMEMBER_LOGIN_KEY),
        secureStorage.getItemAsync(REMEMBERED_PHONE_KEY),
      ]);

      if (!isMounted) return;

      const shouldRemember = remembered === 'true';
      setRememberMe(shouldRemember);
      if (shouldRemember && savedPhone) {
        setPhoneNumber(savedPhone);
      }
    };

    void loadRememberedLogin();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!lockExpiresAt) return;

    const timer = setInterval(() => {
      if (lockExpiresAt <= Date.now()) {
        setLockExpiresAt(null);
        setValidationError('');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockExpiresAt]);

  const handleLogin = async () => {
    if (isLoading || isTemporarilyLocked) return;

    const normalizedPhone = phoneNumber.trim();
    if (!/^0\d{9}$/.test(normalizedPhone)) {
      setValidationError('Số điện thoại không hợp lệ');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
      return;
    }
    try {
      setValidationError('');
      clearError();
      const loggedInUser = await login(normalizedPhone, password);
      if (rememberMe) {
        await secureStorage.setItemAsync(REMEMBER_LOGIN_KEY, 'true');
        await secureStorage.setItemAsync(REMEMBERED_PHONE_KEY, phoneNumber.trim());
      } else {
        await secureStorage.deleteItemAsync(REMEMBER_LOGIN_KEY);
        await secureStorage.deleteItemAsync(REMEMBERED_PHONE_KEY);
      }
      if (loggedInUser.mustChangePassword ?? (loggedInUser as any).MustChangePassword) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ForceChangePassword' }],
        });
      }
    } catch (err: any) {
      const isNetworkError = !err.response;
      const errorMessage = err.response?.data?.message || 'Số điện thoại hoặc mật khẩu không đúng';
      if (!isNetworkError && errorMessage.includes(TEMP_LOCK_MESSAGE)) {
        setValidationError(errorMessage);
        setLockExpiresAt(Date.now() + TEMP_LOCK_DURATION_MS);
      }
      Alert.alert(
        'Đăng nhập thất bại',
        isNetworkError
          ? `Không kết nối được đến máy chủ.\n\nĐã thử:\n${(err.attemptedUrls || []).join('\n')}`
          : errorMessage
      );
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop' }}
      style={styles.bg}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      {/* Dark overlay */}
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Glass card */}
          <View style={styles.card}>
            <Text style={styles.title}>Đăng nhập</Text>

            {(validationError || error) && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{validationError || error}</Text>
              </View>
            )}

            {/* Phone input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={phoneNumber}
                onChangeText={(value) => {
                  setPhoneNumber(value);
                  if (validationError) setValidationError('');
                  if (lockExpiresAt) setLockExpiresAt(null);
                  if (error) clearError();
                }}
                keyboardType="phone-pad"
                autoCapitalize="none"
                editable={!isLoading}
                selectionColor="white"
              />
            </View>

            {/* Password input */}
            <View style={[styles.inputWrapper, styles.passwordWrapper]}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Mật khẩu"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
                selectionColor="white"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((current) => !current)}
                activeOpacity={0.75}
                disabled={isLoading}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            {/* Remember me + Forgot password */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.checkboxRow} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.button, (isLoading || isTemporarilyLocked) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading || isTemporarilyLocked}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Đang đăng nhập...' : isTemporarilyLocked ? 'Tài khoản tạm khóa' : 'Đăng nhập'}
              </Text>
            </TouchableOpacity>

            {/* Footer note */}
            <Text style={styles.footerText}>
              Tài khoản được cấp bởi quản trị viên. Vui lòng liên hệ ban quản lý nếu cần hỗ trợ.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 44,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 36,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    textAlign: 'center',
  },
  inputWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    marginBottom: 24,
  },
  passwordWrapper: {
    position: 'relative',
  },
  input: {
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 10,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  passwordInput: {
    paddingRight: 42,
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  checkmark: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111',
    lineHeight: 14,
  },
  rememberText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '400',
  },
  forgotText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#111827',
    fontSize: 17,
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 24,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
