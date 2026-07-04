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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useNavigation } from '@react-navigation/native';
import maintenanceService from '../services/maintenance.service';
import apiService from '../services/api.service';
import { useAuthStore } from '../store/authStore';
import { contractService, ContractDetail } from '../services/contract.service';

export default function ReportIssueScreen() {
  const navigation = useNavigation();
  const { activeContractId } = useAuthStore();
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [contracts, setContracts] = useState<ContractDetail[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let mounted = true;

    contractService.getMyContracts()
      .then((items) => {
        if (!mounted) return;
        setContracts(items);
        const activeContract = items.find((item) => item.id === activeContractId);
        setSelectedRoomId(activeContract?.roomId ?? items[0]?.roomId ?? null);
      })
      .catch(() => {
        if (mounted) setContracts([]);
      })
      .finally(() => {
        if (mounted) setIsLoadingRooms(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeContractId]);

  const pickImages = async (source: 'camera' | 'library') => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Cần cấp quyền truy cập camera để chụp ảnh');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsMultipleSelection: true,
          selectionLimit: 3,
        });
      }

      if (!result.canceled) {
        setSelectedImages(prev => {
          const combined = [...prev, ...result.assets];
          return combined.slice(0, 3);
        });
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh, vui lòng thử lại');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    const axiosInst = apiService.getAxiosInstance();

    for (let index = 0; index < selectedImages.length; index++) {
      const img = selectedImages[index];
      const formData = new FormData();

      // Convert to JPEG first so every uploaded image can be rendered consistently
      // across Android/iOS/web (avoids HEIC/HEIF compatibility issues).
      const converted = await manipulateAsync(
        img.uri,
        [],
        { compress: 0.82, format: SaveFormat.JPEG }
      );

      const filename = `photo_${Date.now()}_${index + 1}.jpg`;
      formData.append('file', { uri: converted.uri, name: filename, type: 'image/jpeg' } as any);

      const res = await axiosInst.post<{ url: string }>('/api/File/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      urls.push(res.data.url);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại sự cố');
      return;
    }

    if (!selectedRoomId) {
      Alert.alert('Lỗi', 'Không tìm thấy phòng đang thuê để gửi sự cố');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng mô tả chi tiết sự cố');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload images first if any selected
      let mediaUrls: string | undefined;
      if (selectedImages.length > 0) {
        setIsUploading(true);
        try {
          const urls = await uploadImages();
          // Store all URLs as JSON array
          mediaUrls = JSON.stringify(urls);
        } finally {
          setIsUploading(false);
        }
      }

      await maintenanceService.create({
        roomId: selectedRoomId,
        issueType: selectedType,
        description: description.trim(),
        mediaUrls,
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo sự cố</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.description}>
          Vui lòng cung cấp thông tin chi tiết và hình ảnh để giúp chúng tôi xử lý nhanh hơn.
        </Text>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phòng xảy ra sự cố *</Text>
            {isLoadingRooms ? (
              <View style={styles.roomLoading}>
                <ActivityIndicator size="small" color="#1A4B84" />
                <Text style={styles.roomLoadingText}>Đang tải danh sách phòng...</Text>
              </View>
            ) : contracts.length > 0 ? (
              <View style={styles.roomGrid}>
                {contracts.map((contract) => {
                  const selected = selectedRoomId === contract.roomId;
                  return (
                    <TouchableOpacity
                      key={contract.id}
                      style={[styles.roomButton, selected && styles.roomButtonActive]}
                      onPress={() => setSelectedRoomId(contract.roomId)}
                    >
                      <Ionicons
                        name="home-outline"
                        size={20}
                        color={selected ? '#1A4B84' : '#6B7280'}
                      />
                      <View style={styles.roomButtonContent}>
                        <Text style={[styles.roomButtonTitle, selected && styles.roomButtonTitleActive]}>
                          Phòng {contract.roomNumber || `#${contract.roomId}`}
                        </Text>
                        {contract.contractCode && (
                          <Text style={styles.roomButtonSubtitle}>{contract.contractCode}</Text>
                        )}
                      </View>
                      {selected && <Ionicons name="checkmark-circle" size={20} color="#1A4B84" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.roomError}>
                <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
                <Text style={styles.roomErrorText}>Không tìm thấy phòng đang thuê</Text>
              </View>
            )}
          </View>

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
                    size={18}
                    color={selectedType === type ? '#1A4B84' : '#6B7280'}
                  />
                  <Text
                    numberOfLines={2}
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
            <Text style={styles.label}>
              Hình ảnh trước khi sửa {selectedImages.length > 0 ? `(${selectedImages.length}/3)` : '(tuỳ chọn)'}
            </Text>

            {/* Selected image previews */}
            {selectedImages.length > 0 && (
              <View style={styles.imagePreviewRow}>
                {selectedImages.map((img, idx) => (
                  <View key={idx} style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => removeImage(idx)}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Pick buttons — only show if < 3 images selected */}
            {selectedImages.length < 3 && (
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={() => pickImages('camera')}>
                  <Ionicons name="camera" size={28} color="#1A4B84" />
                  <Text style={styles.photoButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={() => pickImages('library')}>
                  <Ionicons name="images" size={28} color="#1A4B84" />
                  <Text style={styles.photoButtonText}>Thư viện</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.photoNote}>
              Ảnh trước khi sửa giúp BQL xử lý nhanh hơn (tối đa 3 ảnh, mỗi ảnh ≤ 5MB)
            </Text>
          </View>
        </View>

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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.submitButtonText}>
                  {isUploading ? 'Đang tải ảnh...' : 'Đang gửi...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
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
    gap: 14,
  },
  formGroup: {
    marginBottom: 0,
  },
  roomGrid: {
    gap: 10,
  },
  roomButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  roomButtonActive: {
    borderColor: '#1A4B84',
    backgroundColor: '#E8F0FB',
  },
  roomButtonContent: {
    flex: 1,
  },
  roomButtonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  roomButtonTitleActive: {
    color: '#1A4B84',
  },
  roomButtonSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#9CA3AF',
  },
  roomLoading: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  roomLoadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  roomError: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  roomErrorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
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
    backgroundColor: '#E8F0FB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A4B84',
    marginTop: 8,
  },
  photoNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  imagePreviewWrapper: {
    position: 'relative',
    width: 88,
    height: 88,
  },
  imagePreview: {
    width: 88,
    height: 88,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 4,
    paddingBottom: 24,
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
    backgroundColor: '#1A4B84',
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
    gap: 8,
  },
  typeButton: {
    width: '23%',
    minHeight: 64,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    borderColor: '#1A4B84',
    backgroundColor: '#E8F0FB',
  },
  typeButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: '#1A4B84',
    fontWeight: '600',
  },
});
