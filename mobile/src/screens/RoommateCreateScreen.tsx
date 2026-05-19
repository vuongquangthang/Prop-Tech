import React, { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { currentAccount, formatCurrency, roomInfo } from './roommateData';

export default function RoommateCreateScreen() {
  const navigation = useNavigation<any>();
  const [currentOccupants, setCurrentOccupants] = useState('');
  const [needMore, setNeedMore] = useState('');
  const [priceAfterSplit, setPriceAfterSplit] = useState({
    roomPrice: '',
    electricity: '',
    water: '',
    management: '',
  });
  const [moveInType, setMoveInType] = useState<'now' | 'date'>('now');
  const [moveInDate, setMoveInDate] = useState('');
  const [floodZone, setFloodZone] = useState<'yes' | 'no'>('no');
  const [requirements, setRequirements] = useState('');
  const [contactType, setContactType] = useState<'current' | 'other'>('current');
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');

  const handleSubmit = () => {
    Alert.alert('Thành công', 'Bài đăng đã được tạo thành công!', [
      {
        text: 'OK',
        onPress: () => navigation.navigate('RoommatePost', { hasPost: true }),
      },
    ]);
  };

  const PriceInput = ({
    label,
    before,
    value,
    onChangeText,
  }: {
    label: string;
    before: number;
    value: string;
    onChangeText: (value: string) => void;
  }) => (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceBefore}>{formatCurrency(before)}đ</Text>
      <TextInput
        style={styles.priceInput}
        placeholder="Nhập giá"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo bài đăng tìm người ở ghép</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin phòng</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
            {roomInfo.images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.roomImage} />
            ))}
          </ScrollView>

          <View style={styles.infoGrid}>
            <Field label="Mã phòng" value={roomInfo.roomCode} />
            <Field label="Vị trí" value={roomInfo.location} />
            <Field label="Diện tích" value={roomInfo.area} />
            <Field label="Số người tối đa" value={`${roomInfo.maxOccupants} người`} />
            <Field label="Giá thuê" value={`${formatCurrency(roomInfo.rentPrice)} VNĐ/tháng`} />
            <Field label="Loại phòng" value={roomInfo.roomType} />
          </View>

          <View style={styles.amenityWrap}>
            <Text style={styles.label}>Tiện nghi:</Text>
            <View style={styles.tagsWrap}>
              {roomInfo.amenities.map((amenity) => (
                <View key={amenity} style={styles.tag}>
                  <Text style={styles.tagText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin đăng bài</Text>
          <View style={styles.twoCols}>
            <InputField
              label="Số người đang ở *"
              value={currentOccupants}
              onChangeText={setCurrentOccupants}
              keyboardType="numeric"
            />
            <InputField
              label="Cần tìm thêm *"
              value={needMore}
              onChangeText={setNeedMore}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.label}>Bảng giá *</Text>
          <View style={styles.priceTable}>
            <View style={styles.priceHeaderRow}>
              <Text style={styles.priceHeaderText}>Loại phí</Text>
              <Text style={styles.priceHeaderText}>Trước chia</Text>
              <Text style={[styles.priceHeaderText, styles.textRight]}>Sau chia</Text>
            </View>
            <PriceInput
              label="Giá phòng"
              before={roomInfo.pricing.roomPrice}
              value={priceAfterSplit.roomPrice}
              onChangeText={(value) => setPriceAfterSplit({ ...priceAfterSplit, roomPrice: value })}
            />
            <PriceInput
              label="Tiền điện"
              before={roomInfo.pricing.electricity}
              value={priceAfterSplit.electricity}
              onChangeText={(value) => setPriceAfterSplit({ ...priceAfterSplit, electricity: value })}
            />
            <PriceInput
              label="Tiền nước"
              before={roomInfo.pricing.water}
              value={priceAfterSplit.water}
              onChangeText={(value) => setPriceAfterSplit({ ...priceAfterSplit, water: value })}
            />
            <PriceInput
              label="Phí quản lý"
              before={roomInfo.pricing.management}
              value={priceAfterSplit.management}
              onChangeText={(value) => setPriceAfterSplit({ ...priceAfterSplit, management: value })}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thời gian vào ở</Text>
          <RadioRow
            selected={moveInType === 'now'}
            label="Ở luôn"
            onPress={() => setMoveInType('now')}
          />
          <RadioRow
            selected={moveInType === 'date'}
            label="Từ ngày"
            onPress={() => setMoveInType('date')}
          />
          {moveInType === 'date' && (
            <TextInput
              style={styles.fullInput}
              placeholder="dd/mm/yyyy"
              placeholderTextColor="#9CA3AF"
              value={moveInDate}
              onChangeText={setMoveInDate}
            />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin bổ sung</Text>
          <Text style={styles.label}>Có nằm trong khu vực dễ ngập lụt *</Text>
          <View style={styles.row}>
            <RadioRow selected={floodZone === 'yes'} label="Có" onPress={() => setFloodZone('yes')} />
            <RadioRow selected={floodZone === 'no'} label="Không" onPress={() => setFloodZone('no')} />
          </View>
          <Text style={styles.label}>Yêu cầu từ chủ nhà khi cho thuê (nếu có)</Text>
          <TextInput
            style={[styles.fullInput, styles.textArea]}
            multiline
            value={requirements}
            onChangeText={setRequirements}
            placeholder="VD: Không nuôi thú cưng, không hút thuốc trong phòng..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin liên hệ</Text>
          <RadioRow
            selected={contactType === 'current'}
            label={`Lấy từ tài khoản (${currentAccount.name} - ${currentAccount.phone})`}
            onPress={() => setContactType('current')}
          />
          <RadioRow
            selected={contactType === 'other'}
            label="Khác (Nhập thủ công)"
            onPress={() => setContactType('other')}
          />

          {contactType === 'other' && (
            <View style={styles.otherContactWrap}>
              <InputField label="Tên *" value={customName} onChangeText={setCustomName} />
              <InputField
                label="Số điện thoại *"
                value={customPhone}
                onChangeText={setCustomPhone}
                keyboardType="phone-pad"
              />
            </View>
          )}
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Đăng bài</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.fullInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

function RadioRow({
  selected,
  label,
  onPress,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.radioRow} onPress={onPress}>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  imagesRow: {
    gap: 8,
  },
  roomImage: {
    width: 120,
    height: 90,
    borderRadius: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  field: {
    width: '48%',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#F3F4F6',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  fieldValue: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  amenityWrap: {
    gap: 6,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
  },
  twoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
  },
  fullInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  priceTable: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  priceHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  priceHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  textRight: {
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
  },
  priceLabel: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  priceBefore: {
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
    color: '#6B7280',
  },
  priceInput: {
    flex: 1,
    height: 34,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 7,
    paddingHorizontal: 8,
    fontSize: 13,
    textAlign: 'right',
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#1A4B84',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A4B84',
  },
  radioLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  textArea: {
    height: 84,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  otherContactWrap: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    gap: 10,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
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
  cancelButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A4B84',
  },
  submitButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
