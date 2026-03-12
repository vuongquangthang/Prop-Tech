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
  ImageBackground,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthStack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phoneNumber.trim()) return;
    setLoading(true);
    // TODO: gọi API reset mật khẩu
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop' }}
      style={styles.bg}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Quên mật khẩu</Text>
            <Text style={styles.subtitle}>
              Nhập số điện thoại để nhận hướng dẫn đặt lại mật khẩu
            </Text>

            {!submitted ? (
              <>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Số điện thoại"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    editable={!loading}
                    selectionColor="white"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, (!phoneNumber.trim() || loading) && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={!phoneNumber.trim() || loading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successBox}>
                <Text style={styles.successIcon}>✉️</Text>
                <Text style={styles.successTitle}>Yêu cầu đã được gửi!</Text>
                <Text style={styles.successText}>
                  Vui lòng liên hệ quản trị viên hoặc ban quản lý để được hỗ trợ đặt lại mật khẩu.
                </Text>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.buttonText}>Quay lại đăng nhập</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>← Quay lại đăng nhập</Text>
            </TouchableOpacity>
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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  inputWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    marginBottom: 32,
  },
  input: {
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 10,
    fontWeight: '500',
    backgroundColor: 'transparent',
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
  successBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
});
