import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
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
import { currentAccount, formatCurrency, postDetail, roomInfo } from './roommateData';

type SplitPriceKey = 'roomPrice' | 'electricity' | 'water' | 'management';

export default function RoommateEditScreen() {
  const navigation = useNavigation<any>();
  const [formData, setFormData] = useState({
    currentOccupants: String(postDetail.currentOccupants),
    needMore: String(postDetail.needMore),
    priceAfterSplit: {
      roomPrice: String(postDetail.pricing.roomPrice.after),
      electricity: String(postDetail.pricing.electricity.after),
      water: String(postDetail.pricing.water.after),
      management: String(postDetail.pricing.management.after),
    },
    moveInType: postDetail.moveInType === 'date' ? 'date' : 'now',
    moveInDate: postDetail.moveInDate,
    floodZone: postDetail.floodZone ? 'yes' : 'no',
    requirements: postDetail.requirements,
    contactType: 'account',
    contactName: '',
    contactPhone: '',
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const updatePrice = (key: SplitPriceKey, value: string) => {
    setFormData((prev) => ({
      ...prev,
      priceAfterSplit: { ...prev.priceAfterSplit, [key]: value },
    }));
  };

  const handleSave = () => {
    setShowSaveDialog(false);
    Alert.alert('Thành công', 'Đã lưu thay đổi bài đăng.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Chỉnh sửa bài đăng</Text>
          <Text style={styles.headerSub}>{roomInfo.roomCode}</Text>
        </View>
        <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('RoommateHistory')}>
          <Ionicons name="time-outline" size={14} color="#4B5563" />
          <Text style={styles.historyBtnText}>Lịch sử</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Thông tin phòng</Text>
            <View style={styles.systemTag}>
              <Text style={styles.systemTagText}>Từ hệ thống</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
            {roomInfo.images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.roomImage} />
            ))}
          </ScrollView>
          <View style={styles.infoGrid}>
            <Field label="Mã phòng" value={roomInfo.roomCode} />
            <Field label="Vị trí" value={roomInfo.location} />
            <Field label="Diện tích" value={roomInfo.area} />
            <Field label="Giá thuê" value={`${formatCurrency(roomInfo.rentPrice)}đ`} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Thông tin đăng bài</Text>
            <View style={styles.editTag}>
              <Text style={styles.editTagText}>Có thể sửa</Text>
            </View>
          </View>

          <View style={styles.twoCols}>
            <InputField
              label="Số người đang ở"
              value={formData.currentOccupants}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, currentOccupants: value }))}
              keyboardType="numeric"
            />
            <InputField
              label="Cần tìm thêm"
              value={formData.needMore}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, needMore: value }))}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.label}>Bảng giá</Text>
          <View style={styles.priceTable}>
            <PriceRow
              label="Giá phòng"
              before={roomInfo.pricing.roomPrice}
              value={formData.priceAfterSplit.roomPrice}
              onChangeText={(value) => updatePrice('roomPrice', value)}
            />
            <PriceRow
              label="Tiền điện"
              before={roomInfo.pricing.electricity}
              value={formData.priceAfterSplit.electricity}
              onChangeText={(value) => updatePrice('electricity', value)}
            />
            <PriceRow
              label="Tiền nước"
              before={roomInfo.pricing.water}
              value={formData.priceAfterSplit.water}
              onChangeText={(value) => updatePrice('water', value)}
            />
            <PriceRow
              label="Phí quản lý"
              before={roomInfo.pricing.management}
              value={formData.priceAfterSplit.management}
              onChangeText={(value) => updatePrice('management', value)}
            />
          </View>

          <Text style={styles.label}>Có thể vào ở</Text>
          <RadioRow
            selected={formData.moveInType === 'now'}
            label="Ở luôn"
            onPress={() => setFormData((prev) => ({ ...prev, moveInType: 'now' }))}
          />
          <RadioRow
            selected={formData.moveInType === 'date'}
            label="Từ ngày"
            onPress={() => setFormData((prev) => ({ ...prev, moveInType: 'date' }))}
          />
          {formData.moveInType === 'date' && (
            <TextInput
              style={styles.input}
              placeholder="dd/mm/yyyy"
              placeholderTextColor="#9CA3AF"
              value={formData.moveInDate}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, moveInDate: value }))}
            />
          )}

          <Text style={styles.label}>Nằm trong khu vực dễ ngập lụt</Text>
          <View style={styles.inlineRow}>
            <RadioRow
              selected={formData.floodZone === 'yes'}
              label="Có"
              onPress={() => setFormData((prev) => ({ ...prev, floodZone: 'yes' }))}
            />
            <RadioRow
              selected={formData.floodZone === 'no'}
              label="Không"
              onPress={() => setFormData((prev) => ({ ...prev, floodZone: 'no' }))}
            />
          </View>

          <Text style={styles.label}>Yêu cầu từ cư dân đang ở</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={formData.requirements}
            onChangeText={(value) => setFormData((prev) => ({ ...prev, requirements: value }))}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin liên hệ</Text>
          <RadioRow
            selected={formData.contactType === 'account'}
            label={`Lấy từ tài khoản (${currentAccount.name} - ${currentAccount.phone})`}
            onPress={() => setFormData((prev) => ({ ...prev, contactType: 'account' }))}
          />
          <RadioRow
            selected={formData.contactType === 'other'}
            label="Khác"
            onPress={() => setFormData((prev) => ({ ...prev, contactType: 'other' }))}
          />
          {formData.contactType === 'other' && (
            <View style={styles.otherContact}>
              <InputField
                label="Tên"
                value={formData.contactName}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, contactName: value }))}
              />
              <InputField
                label="Số điện thoại"
                value={formData.contactPhone}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, contactPhone: value }))}
                keyboardType="phone-pad"
              />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={() => setShowSaveDialog(true)}>
          <Ionicons name="save-outline" size={16} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showSaveDialog} transparent animationType="fade" onRequestClose={() => setShowSaveDialog(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Xác nhận lưu thay đổi?</Text>
            <Text style={styles.dialogText}>
              Bạn có chắc chắn muốn lưu các thay đổi này không? Phiên bản hiện tại sẽ được lưu vào lịch sử chỉnh sửa.
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancel} onPress={() => setShowSaveDialog(false)}>
                <Text style={styles.dialogCancelText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogConfirm} onPress={handleSave}>
                <Text style={styles.dialogConfirmText}>Xác nhận lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
        style={styles.input}
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
      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function PriceRow({
  label,
  before,
  value,
  onChangeText,
}: {
  label: string;
  before: number;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceName}>{label}</Text>
      <Text style={styles.priceBefore}>{formatCurrency(before)}đ</Text>
      <TextInput
        style={styles.priceInput}
        value={value}
        keyboardType="numeric"
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSub: {
    marginTop: 1,
    fontSize: 12,
    color: '#6B7280',
  },
  historyBtn: {
    height: 30,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  historyBtnText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  content: {
    padding: 16,
    paddingBottom: 96,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  systemTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  systemTagText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  editTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#1A4B84',
  },
  editTagText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  imagesRow: {
    gap: 8,
  },
  roomImage: {
    width: 100,
    height: 74,
    borderRadius: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  field: {
    width: '48%',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#F3F4F6',
  },
  fieldLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  fieldValue: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  twoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 5,
  },
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
  textArea: {
    height: 76,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  priceTable: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 6,
  },
  priceName: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  priceBefore: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'right',
  },
  priceInput: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 7,
    textAlign: 'right',
    fontSize: 13,
    color: '#111827',
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 18,
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
  radioOuterActive: {
    borderColor: '#1A4B84',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A4B84',
  },
  radioLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  otherContact: {
    marginTop: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#DBEAFE',
    paddingLeft: 10,
    gap: 8,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1A4B84',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  dialogText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  dialogActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  dialogCancel: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dialogCancelText: {
    color: '#374151',
    fontWeight: '500',
  },
  dialogConfirm: {
    backgroundColor: '#1A4B84',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dialogConfirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
