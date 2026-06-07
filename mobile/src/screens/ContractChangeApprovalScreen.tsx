import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import contractChangeService, { ContractChangeDetail } from '../services/contract-change.service';

export default function ContractChangeApprovalScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const notificationId = Number(route.params?.notificationId || 0);

  const [detail, setDetail] = useState<ContractChangeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!notificationId) return;
    contractChangeService.getDetail(notificationId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [notificationId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  const handleConfirm = async () => {
    if (!detail) return;
    try {
      setSubmitting(true);
      await contractChangeService.confirm(detail.notificationId);
      Alert.alert('Thành công', 'Đã xác nhận thay đổi hợp đồng. Hệ thống đã cập nhật hợp đồng mới.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể xác nhận thay đổi hợp đồng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscuss = async () => {
    if (!detail) return;
    try {
      setSubmitting(true);
      await contractChangeService.discuss(detail.notificationId, message);
      Alert.alert('Đã gửi', 'Ban quản lý đã nhận yêu cầu thảo luận lại. Thông báo sẽ được giữ đến khi bạn xác nhận.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể gửi yêu cầu thảo luận lại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1A4B84" />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>Không thể tải đề xuất thay đổi hợp đồng.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thay đổi hợp đồng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.card}>
          <Text style={styles.title}>Hợp đồng {detail.contractCode || `#${detail.contractId}`}</Text>
          <Text style={styles.sub}>Phòng: {detail.roomNumber || detail.roomId}</Text>
          <Text style={styles.sub}>Ngày áp dụng: {new Date(detail.effectiveDate).toLocaleDateString('vi-VN')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Giá phòng</Text>
          <View style={styles.row}><Text>Hiện tại</Text><Text>{formatCurrency(detail.currentRentPrice)}</Text></View>
          <View style={styles.row}><Text>Đề xuất mới</Text><Text style={styles.highlight}>{detail.proposedRentPrice ? formatCurrency(detail.proposedRentPrice) : 'Không đổi'}</Text></View>
        </View>

        {detail.servicePriceChanges.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Điều chỉnh giá dịch vụ</Text>
            {detail.servicePriceChanges.map((s) => (
              <View key={s.serviceId} style={styles.rowColumn}>
                <Text style={styles.bold}>{s.serviceName}</Text>
                <Text>{formatCurrency(s.currentPrice)} → {formatCurrency(s.newPrice)}</Text>
              </View>
            ))}
          </View>
        )}

        {detail.addedServices.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Dịch vụ thêm mới</Text>
            {detail.addedServices.map((s) => (
              <View key={s.serviceId} style={styles.rowColumn}>
                <Text style={styles.bold}>{s.serviceName}</Text>
                <Text>{formatCurrency(s.unitPrice)}{s.unit ? ` / ${s.unit}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thảo luận lại với Ban quản lý</Text>
          <TextInput
            style={styles.input}
            multiline
            value={message}
            onChangeText={setMessage}
            placeholder="Nhập nội dung bạn muốn trao đổi..."
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btn, styles.secondary]} disabled={submitting} onPress={handleDiscuss}>
          <Text style={styles.secondaryText}>Thảo luận lại với Ban quản lý</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.primary]} disabled={submitting} onPress={handleConfirm}>
          <Text style={styles.primaryText}>Xác nhận thay đổi hợp đồng</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sub: { marginTop: 4, color: '#4B5563', fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowColumn: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  bold: { fontWeight: '600', color: '#1F2937' },
  highlight: { fontWeight: '700', color: '#1D4ED8' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    minHeight: 88,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
    gap: 8,
  },
  btn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  secondary: { borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#fff' },
  primary: { backgroundColor: '#1A4B84' },
  secondaryText: { color: '#374151', fontWeight: '600' },
  primaryText: { color: '#fff', fontWeight: '700' },
});
