import React, { useCallback, useRef, useState } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { contractService } from '../services/contract.service';
import { postService } from '../services/post.service';
import { MyRoom, roomService, RoomDetail } from '../services/room.service';
import { resolveImageUrl } from '../utils/image';
import { servicesService, type ServiceInRoomDto } from '../services/services.service';
import * as ImagePicker from 'expo-image-picker';
import { fileService } from '../services/file.service';
import { useAuthStore } from '../store/authStore';
import type { CreatePostDto, PostServiceLineItemDto } from '../types/dto';

type PriceMap = Record<string, string>;

type RoomFormService = {
  key: string;
  name: string;
  unit: string;
  beforePrice: number;
};

const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.round(value || 0)));

const formatRoomType = (value?: string | null) => {
  if (!value) return 'Chưa cập nhật';
  return value.trim();
};

const isApartmentRoomType = (value?: string | null) => {
  const normalized = (value || '').trim().toLowerCase();
  return normalized.includes('căn hộ') || normalized.includes('apartment');
};

const getRoomMeta = (detail?: RoomDetail | null) => {
  if (!detail) {
    return {
      icon: 'information-circle-outline' as const,
      color: '#9CA3AF',
      text: 'Chưa cập nhật',
    };
  }

  if (isApartmentRoomType(detail.roomType)) {
    const parts = [
      `${detail.bedroomCount ?? 0} phòng ngủ`,
      `${detail.kitchenCount ?? 0} bếp`,
      `${detail.livingRoomCount ?? 0} khách`,
      `${detail.bathroomCount ?? 0} vệ sinh`,
    ];

    return {
      icon: 'home-outline' as const,
      color: '#9CA3AF',
      text: parts.join(' · '),
    };
  }

  if (detail.hasPrivateBathroom === true) {
    return {
      icon: 'checkmark' as const,
      color: '#10B981',
      text: 'Có vệ sinh khép kín',
    };
  }

  if (detail.hasPrivateBathroom === false) {
    return {
      icon: 'close' as const,
      color: '#9CA3AF',
      text: 'Không có vệ sinh khép kín',
    };
  }

  return {
    icon: 'information-circle-outline' as const,
    color: '#9CA3AF',
    text: 'Chưa cập nhật',
  };
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'service';

const parseMoneyInput = (value: string): number => {
  const normalized = value.replace(/[^\d]/g, '');
  if (!normalized) return 0;
  return Number(normalized);
};

const formatMoneyInput = (value: string): string => {
  const amount = parseMoneyInput(value);
  return amount > 0 ? formatCurrency(amount) : '';
};

const parseDateInput = (value: string): string | null => {
  if (!value.trim()) return null;
  const normalized = value.trim();
  const parts = normalized.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) return null;
  return date.toISOString();
};

const buildServiceRows = (room: MyRoom): RoomFormService[] => {
  const rows: RoomFormService[] = room.services.map((service) => ({
    key: `svc-${service.serviceId}`,
    name: service.serviceName,
    unit: service.unit || '',
    beforePrice: Number(service.price || 0),
  }));

  if (!rows.length && room.electricityBasePrice) {
    rows.push({
      key: 'electricity',
      name: 'Tiền điện',
      unit: 'kWh',
      beforePrice: room.electricityBasePrice,
    });
  }

  if (!rows.length && room.waterPricePerCubicMeter) {
    rows.push({
      key: 'water',
      name: 'Tiền nước',
      unit: 'm3',
      beforePrice: room.waterPricePerCubicMeter,
    });
  }

  return rows;
};

export default function RoommateCreateScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const scrollRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [room, setRoom] = useState<MyRoom | null>(null);
  const [roomDetail, setRoomDetail] = useState<RoomDetail | null>(null);
  const [services, setServices] = useState<RoomFormService[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [currentOccupants, setCurrentOccupants] = useState(0);
  const [needMore, setNeedMore] = useState('1');
  const [baseRentPrice, setBaseRentPrice] = useState('');
  const [autoBase, setAutoBase] = useState(true);
  const [lastAutoBaseValue, setLastAutoBaseValue] = useState('');
  const [servicePrices, setServicePrices] = useState<PriceMap>({});
  const [moveInType, setMoveInType] = useState<'immediate' | 'from-date'>('immediate');
  const [moveInDate, setMoveInDate] = useState('');
  const [floodProne, setFloodProne] = useState<'yes' | 'no'>('no');
  const [requirements, setRequirements] = useState('');
  const [contactType, setContactType] = useState<'current' | 'other'>('current');
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [images, setImages] = useState<Array<{ uri: string; uploadedUrl?: string; name?: string }>>([]);
  const [roomAmenities, setRoomAmenities] = useState<string[]>([]);
  const roomMeta = getRoomMeta(roomDetail);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setImages([]);
    try {
      const myRoom = await roomService.getMyRoom();
      setRoom(myRoom);

      // preload amenities
      let amenityList: string[] = Array.isArray(myRoom.amenities) ? myRoom.amenities : [];
      try {
        const detail = await roomService.getRoomDetail(myRoom.roomId);
        setRoomDetail(detail);
        const assets = Array.isArray(detail.assets) ? detail.assets : [];
        const assetNames = assets.map((asset) => asset.assetName).filter(Boolean);
        if (assetNames.length) {
          amenityList = assetNames;
        }

      } catch (err) {
        console.warn('Không thể tải tiện nghi từ DB', err);
      }
      setRoomAmenities(amenityList);

      const contract = await contractService.getById(myRoom.contractId);
      const now = new Date();
      const activeResidents = contract.residents.filter((resident) => {
        if (!resident.toDate) return true;
        const toDate = new Date(resident.toDate);
        return !Number.isNaN(toDate.getTime()) && toDate > now;
      }).length;
      setCurrentOccupants(activeResidents);

      let dbServices: ServiceInRoomDto[] = [];
      try {
        dbServices = await servicesService.getByRoom(myRoom.roomId);
      } catch (err) {
        console.warn('Không thể tải danh sách dịch vụ từ DB', err);
      }

      const roomRows = dbServices.length
        ? dbServices.map((service) => ({
            key: `svc-${service.serviceId}`,
            name: service.serviceName,
            unit: service.unit || '',
            beforePrice: Number(service.unitPrice || 0),
          }))
        : buildServiceRows(myRoom);
      setServices(roomRows);

      setBaseRentPrice(formatCurrency(myRoom.rentPrice || 0));
      const initialServicePrices: PriceMap = {};
      roomRows.forEach((item) => {
        initialServicePrices[item.key] = item.beforePrice > 0 ? formatCurrency(item.beforePrice) : '';
      });
      setServicePrices(initialServicePrices);

      const defaultNeedMore = myRoom.maxOccupants ? Math.max(1, myRoom.maxOccupants - activeResidents) : 1;
      setNeedMore(String(defaultNeedMore));

      // auto-calculate per-person rent (base rent after split)
      try {
        const totalPeople = Math.max(1, activeResidents + defaultNeedMore);
        const perPerson = Math.round((myRoom.rentPrice || 0) / totalPeople);
        const formatted = formatCurrency(perPerson);
        setBaseRentPrice(formatted);
        setLastAutoBaseValue(formatted);
        setAutoBase(true);
      } catch (err) {
        // fallback: keep room rent
        setBaseRentPrice(formatCurrency(myRoom.rentPrice || 0));
      }

      if (!title.trim()) {
        setTitle(`Tìm bạn ở ghép phòng ${myRoom.roomCode}`);
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tải dữ liệu phòng');
    } finally {
      setLoading(false);
    }
  }, [title, useAuthStore((s) => s.activeContractId)]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onChangeServicePrice = (key: string, value: string) => {
    setServicePrices((prev) => ({ ...prev, [key]: formatMoneyInput(value) }));
  };

  const handleNeedMoreChange = (value: string) => {
    setNeedMore(value);
    if (!autoBase || !room) return;
    const extra = Number.parseInt((value || '').replace(/[^\d]/g, ''), 10) || 0;
    const total = Math.max(1, currentOccupants + extra);
    const per = Math.round((room.rentPrice || 0) / total);
    const formatted = formatCurrency(per);
    setBaseRentPrice(formatted);
    setLastAutoBaseValue(formatted);
  };

  const handleSubmit = async () => {
    if (!room) return;
    if (!title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề bài đăng.');
      return;
    }

    const contactName = contactType === 'current'
      ? user?.residentName || user?.phoneNumber || ''
      : customName.trim();
    const contactPhone = contactType === 'current'
      ? user?.phoneNumber || ''
      : customPhone.trim();

    if (!contactName || !contactPhone) {
      Alert.alert('Thiếu liên hệ', 'Vui lòng cung cấp tên và số điện thoại liên hệ hợp lệ.');
      return;
    }

    if (moveInType === 'from-date' && !parseDateInput(moveInDate)) {
      Alert.alert('Ngày vào ở không hợp lệ', 'Vui lòng nhập ngày theo định dạng dd/mm/yyyy.');
      return;
    }

    const servicePricePayload: PostServiceLineItemDto[] = services.map((item) => ({
      key: slugify(item.key || item.name),
      name: item.name,
      unit: item.unit,
      price: parseMoneyInput(servicePrices[item.key] ?? String(item.beforePrice)),
    }));

    const payload: CreatePostDto = {
      roomId: room.roomId,
      title: title.trim(),
      baseRentPrice: parseMoneyInput(baseRentPrice) || room.rentPrice || 0,
      moveInType,
      moveInDate: moveInType === 'from-date' ? parseDateInput(moveInDate) : null,
      floodProne: floodProne === 'yes',
      landlordRequirements: requirements.trim() ? requirements.trim() : null,
      contactType,
      contactName,
      contactPhone,
      servicePrices: servicePricePayload,
      amenities: roomAmenities,
      imageUrls: [],
    };

    try {
      setSaving(true);

      // Upload images first
      const uploadedUrls: string[] = [];
      for (const img of images) {
        if (img.uploadedUrl) {
          uploadedUrls.push(img.uploadedUrl);
          continue;
        }
        try {
          const url = await fileService.uploadImage(img.uri, img.name);
          uploadedUrls.push(url);
        } catch (err: any) {
          Alert.alert('Lỗi upload ảnh', err?.message || 'Không thể upload ảnh');
          setSaving(false);
          return;
        }
      }
    
      payload.imageUrls = uploadedUrls;

      await postService.create(payload);
      Alert.alert('Thành công', 'Đã tạo bài đăng tìm người ở cùng.', [
        { text: 'OK', onPress: () => navigation.navigate('RoommatePost') },
      ]);
    } catch (e: any) {
      Alert.alert('Không thể tạo bài đăng', e?.response?.data?.message || e?.message || 'Đã có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập bị từ chối', 'Vui lòng cho phép ứng dụng truy cập ảnh để có thể thêm ảnh.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const oversizedAsset = result.assets.find((asset) => asset.fileSize && asset.fileSize > 5 * 1024 * 1024);
      if (oversizedAsset) {
        Alert.alert('Ảnh quá lớn', 'Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      const nextImages = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}_${index}.jpg`,
      }));

      setImages((prev) => [...prev, ...nextImages]);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const scrollToRequirementField = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo bài đăng tìm người ở ghép</Text>
        </View>

        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color="#1A4B84" /></View>
        ) : error ? (
          <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View>
        ) : room ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thông tin phòng</Text>
              {Array.isArray(roomDetail?.imageUrls) && roomDetail!.imageUrls!.filter(Boolean).length > 0 ? (
                <View style={styles.roomMediaBlock}>
                  <Text style={styles.roomSectionLabel}>Ảnh phòng:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roomImageRow}>
                    {roomDetail!.imageUrls!.filter(Boolean).map((u, i) => (
                      <Image
                        key={u + i}
                        source={{ uri: resolveImageUrl(u) }}
                        style={styles.roomPreviewImage}
                      />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <View style={styles.roomInfoPanel}>
                <View style={styles.roomInfoGrid}>
                  <View style={styles.roomInfoCell}>
                    <Text style={styles.roomInfoLabel}>Mã phòng</Text>
                    <Text style={styles.roomInfoValueAccent}>{room.roomCode}</Text>
                  </View>
                  <View style={styles.roomInfoCell}>
                    <Text style={styles.roomInfoLabel}>Vị trí</Text>
                    <Text style={styles.roomInfoValue}>{room.buildingName} - Tầng {room.floorNumber}</Text>
                  </View>
                  <View style={styles.roomInfoCell}>
                    <Text style={styles.roomInfoLabel}>Diện tích</Text>
                    <Text style={styles.roomInfoValue}>{room.area ?? 0} m²</Text>
                  </View>
                  <View style={styles.roomInfoCell}>
                    <Text style={styles.roomInfoLabel}>Số người tối đa</Text>
                    <Text style={styles.roomInfoValue}>{room.maxOccupants ?? 'Chưa cập nhật'} người</Text>
                  </View>
                  <View style={styles.roomInfoCell}>
                    <Text style={styles.roomInfoLabel}>Giá thuê</Text>
                    <Text style={styles.roomInfoValue}>{formatCurrency(room.rentPrice)} VNĐ/tháng</Text>
                  </View>
                  <View style={styles.roomInfoCell}>
                    <Text style={styles.roomInfoLabel}>Loại phòng</Text>
                    <Text style={styles.roomInfoValue}>{formatRoomType(roomDetail?.roomType)}</Text>
                  </View>
                </View>

                <View style={styles.roomInfoDivider} />

                <View style={styles.roomFeatureRow}>
                  <Ionicons name={roomMeta.icon} size={14} color={roomMeta.color} />
                  <Text style={styles.roomFeatureText}>{roomMeta.text}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thông tin đăng bài</Text>

              <Text style={styles.label}>Tiêu đề *</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Nhập tiêu đề" placeholderTextColor="#9CA3AF" />

              <View style={styles.twoCols}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Số người đang ở</Text>
                  <TextInput style={[styles.input, styles.readonlyInput]} editable={false} value={String(currentOccupants)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Cần thêm *</Text>
                  <TextInput style={styles.input} value={needMore} keyboardType="numeric" onChangeText={handleNeedMoreChange} />
                </View>
              </View>

              <Text style={styles.label}>Giá thuê sau chia *</Text>
              <TextInput
                style={styles.input}
                value={baseRentPrice}
                keyboardType="numeric"
                onChangeText={(value) => {
                  setBaseRentPrice(formatMoneyInput(value));
                  setAutoBase(false);
                }}
              />

              {!!services.length && <Text style={styles.label}>Dịch vụ sau chia</Text>}
              {!!services.length && (
                <View style={styles.serviceTable}>
                  <View style={styles.serviceTableHeader}>
                    <Text style={[styles.serviceHeaderText, styles.serviceNameHeader]}>Tên dịch vụ</Text>
                    <Text style={[styles.serviceHeaderText, styles.servicePriceHeader]}>Giá tiền</Text>
                  </View>
                  {services.map((item, index) => (
                    <View
                      key={item.key}
                      style={[
                        styles.serviceTableRow,
                        index === services.length - 1 && styles.serviceTableRowLast,
                      ]}
                    >
                      <View style={styles.serviceNameCell}>
                        <Text style={styles.serviceName}>{item.name}</Text>
                        <Text style={styles.serviceUnit}>{item.unit || 'đơn vị'}</Text>
                      </View>
                      <TextInput
                        style={[styles.input, styles.serviceInput]}
                        keyboardType="numeric"
                        value={servicePrices[item.key] ?? ''}
                        onChangeText={(value) => onChangeServicePrice(item.key, value)}
                        placeholder={`Mặc định ${formatCurrency(item.beforePrice)}`}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  ))}
                </View>
              )}

              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Tiện nghi</Text>
                <View style={styles.amenityPickerBox}>
                  <View style={styles.selectedAmenityList}>
                    {roomAmenities.length > 0 ? roomAmenities.map((amenity, idx) => (
                      <View key={`${amenity}-${idx}`} style={styles.selectedAmenityTag}>
                        <Text style={styles.selectedAmenityText}>{amenity}</Text>
                      </View>
                    )) : <Text style={styles.mutedText}>Chưa có tiện nghi</Text>}
                  </View>
                </View>
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={styles.label}>Ảnh bài đăng</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {images.map((img, idx) => (
                    <View key={img.uri + idx} style={styles.thumbWrap}>
                      <Image source={{ uri: img.uri }} style={styles.thumb} />
                      <TouchableOpacity style={styles.thumbRemove} onPress={() => removeImage(idx)}>
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                  <Text style={{ color: '#1A4B84', fontWeight: '600' }}>Thêm ảnh</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thời gian và yêu cầu</Text>

              <Text style={styles.label}>Có thể vào ở</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.radioRow} onPress={() => setMoveInType('immediate')}>
                  <Ionicons name={moveInType === 'immediate' ? 'radio-button-on' : 'radio-button-off'} size={18} color="#1A4B84" />
                  <Text style={styles.radioText}>Ở luôn</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.radioRow} onPress={() => setMoveInType('from-date')}>
                  <Ionicons name={moveInType === 'from-date' ? 'radio-button-on' : 'radio-button-off'} size={18} color="#1A4B84" />
                  <Text style={styles.radioText}>Từ ngày</Text>
                </TouchableOpacity>
              </View>
              {moveInType === 'from-date' && (
                <TextInput
                  style={styles.input}
                  value={moveInDate}
                  onChangeText={setMoveInDate}
                  placeholder="dd/mm/yyyy"
                  placeholderTextColor="#9CA3AF"
                />
              )}

              <Text style={styles.label}>Khu vực dễ ngập lụt</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.radioRow} onPress={() => setFloodProne('yes')}>
                  <Ionicons name={floodProne === 'yes' ? 'radio-button-on' : 'radio-button-off'} size={18} color="#1A4B84" />
                  <Text style={styles.radioText}>Có</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.radioRow} onPress={() => setFloodProne('no')}>
                  <Ionicons name={floodProne === 'no' ? 'radio-button-on' : 'radio-button-off'} size={18} color="#1A4B84" />
                  <Text style={styles.radioText}>Không</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Yêu cầu từ chủ phòng</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                value={requirements}
                onChangeText={setRequirements}
                onFocus={scrollToRequirementField}
                placeholder="Nhập yêu cầu nếu có"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thông tin liên hệ</Text>
              <TouchableOpacity style={styles.radioRow} onPress={() => setContactType('current')}>
                <Ionicons name={contactType === 'current' ? 'radio-button-on' : 'radio-button-off'} size={18} color="#1A4B84" />
                <Text style={styles.radioText}>Dùng tài khoản hiện tại ({user?.phoneNumber || 'N/A'})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.radioRow} onPress={() => setContactType('other')}>
                <Ionicons name={contactType === 'other' ? 'radio-button-on' : 'radio-button-off'} size={18} color="#1A4B84" />
                <Text style={styles.radioText}>Nhập thủ công</Text>
              </TouchableOpacity>

              {contactType === 'other' && (
                <>
                  <Text style={styles.label}>Tên liên hệ *</Text>
                  <TextInput style={styles.input} value={customName} onChangeText={setCustomName} placeholder="Nguyễn Văn A" placeholderTextColor="#9CA3AF" />
                  <Text style={styles.label}>Số điện thoại *</Text>
                  <TextInput style={styles.input} value={customPhone} onChangeText={setCustomPhone} keyboardType="phone-pad" placeholder="09xxxxxxxx" placeholderTextColor="#9CA3AF" />
                </>
              )}
            </View>

            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={saving}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Đăng bài</Text>}
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, gap: 14, paddingBottom: 24 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  roomText: { fontSize: 14, color: '#374151' },
  roomMediaBlock: {
    gap: 8,
  },
  roomSectionLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  roomImageRow: {
    gap: 8,
  },
  roomPreviewImage: {
    width: 80,
    height: 62,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  roomInfoPanel: {
    borderWidth: 1,
    borderColor: '#D9E2F1',
    borderRadius: 10,
    backgroundColor: '#FCFDFF',
    padding: 12,
    gap: 12,
  },
  roomInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  roomInfoCell: {
    width: '50%',
    paddingRight: 10,
    gap: 4,
  },
  roomInfoLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  roomInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  roomInfoValueAccent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  roomInfoDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  roomFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomFeatureText: {
    fontSize: 13,
    color: '#64748B',
  },
  label: { fontSize: 13, color: '#374151', marginBottom: 4 },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  readonlyInput: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  twoCols: { flexDirection: 'row', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioText: { fontSize: 14, color: '#374151' },
  textArea: { height: 90, textAlignVertical: 'top', paddingTop: 10 },
  serviceTable: {
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  serviceTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  serviceHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  serviceNameHeader: { flex: 1 },
  servicePriceHeader: { width: 132, textAlign: 'right' },
  serviceTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceTableRowLast: {
    borderBottomWidth: 0,
  },
  serviceNameCell: {
    flex: 1,
    gap: 2,
  },
  serviceName: { fontSize: 13, color: '#111827', fontWeight: '500' },
  serviceUnit: { fontSize: 11, color: '#6B7280' },
  serviceInput: { width: 132, height: 36, textAlign: 'right' },
  errorCard: { borderRadius: 12, backgroundColor: '#FEE2E2', padding: 12 },
  errorText: { color: '#B91C1C', fontSize: 14 },
  thumbWrap: { width: 96, height: 96, marginRight: 8, position: 'relative' },
  thumb: { width: 96, height: 96, borderRadius: 8, backgroundColor: '#F3F4F6' },
  thumbRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: 'transparent' },
  imageButton: { height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  amenityPickerBox: { borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 10, padding: 10, backgroundColor: '#FFFFFF' },
  selectedAmenityList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  selectedAmenityTag: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F9FAFB' },
  selectedAmenityText: { fontSize: 12, color: '#374151' },
  mutedText: { fontSize: 12, color: '#9CA3AF' },
  footerRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  submitButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A4B84',
  },
  submitButtonText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
});
