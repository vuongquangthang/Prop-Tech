import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import maintenanceService from '../services/maintenance.service';
import { useAuthStore } from '../store/authStore';

export default function ReportIssueScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại sự cố');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng mô tả chi tiết sự cố');
      return;
    }

    try {
      setIsSubmitting(true);
      
      console.log('📤 Creating maintenance request:', {
        issueType: selectedType,
        description: description.trim(),
      });

      await maintenanceService.create({
        issueType: selectedType,
        description: description.trim(),
      });

      Alert.alert(
        'Thành công',
        'Yêu cầu sửa chữa đã được gửi. Ban quản lý sẽ xử lý trong thời gian sớm nhất.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Report issue error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Không thể gửi yêu cầu. Vui lòng thử lại sau.';
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo sự cố</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Vui lòng cung cấp thông tin chi tiết và hình ảnh để giúp chúng tôi xử lý nhanh hơn.
        </Text>

        <View style={styles.form}>
          {/* Issue Type */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Loại sự cố *</Text>
            <View style={styles.typeGrid}>
              {['elevator', 'water', 'electrical', 'security', 'cleaning', 'parking', 'noise', 'other'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    selectedType === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Ionicons
                    name={maintenanceService.getIssueTypeIcon(type) as any}
                    size={24}
                    color={selectedType === type ? '#2563EB' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {maintenanceService.getIssueTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Mô tả chi tiết *</Text>
            <TextInput
              style={styles.textarea}
              multiline
              numberOfLines={4}
              placeholder="Nhập mô tả tình trạng hư hỏng, vị trí, mức độ,..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
            />
            <Text style={styles.charCount}>{description.length}/500 ký tự</Text>
          </View>

          {/* Photos */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Hình ảnh/Video đính kèm *</Text>
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoButton}>
                <Ionicons name="camera" size={28} color="#2563EB" />
                <Text style={styles.photoButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton}>
                <Ionicons name="images" size={28} color="#2563EB" />
                <Text style={styles.photoButtonText}>Thư viện</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.photoNote}>
              Vui lòng tải lên ít nhất 1 hình ảnh
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 14,
    color: '#374151',
  },
  textarea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#374151',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  photoButton: {
    flex: 1,
    paddingVertical: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
    marginTop: 8,
  },
  photoNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
  typeButtonTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
});
