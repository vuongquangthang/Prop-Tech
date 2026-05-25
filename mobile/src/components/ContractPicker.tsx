import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { contractService } from '../services/contract.service';
import { useAuthStore } from '../store/authStore';
import { SettingRow } from './SettingRow';

function formatDateRange(start?: string, end?: string | null) {
  if (!start) return 'Không rõ';
  const s = new Date(start).toLocaleDateString('vi-VN');
  if (!end) return `Từ ${s}`;
  const e = new Date(end).toLocaleDateString('vi-VN');
  return `${s} → ${e}`;
}

function contractStatus(contract: any) {
  if (!contract) return { label: 'Không rõ', color: '#6B7280' };
  const today = new Date();
  const start = new Date(contract.startDate);
  const end = contract.expectedEndDate ? new Date(contract.expectedEndDate) : null;
  if (end && today > end) return { label: 'Hết hạn', color: '#DC2626' };
  if (start > today) return { label: 'Sắp bắt đầu', color: '#3B82F6' };
  if (end) {
    const daysLeft = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) return { label: `Còn ${daysLeft} ngày`, color: '#F97316' };
  }
  return { label: 'Đang hoạt động', color: '#10B981' };
}

export default function ContractPicker() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const activeContractId = useAuthStore((s) => s.activeContractId);
  const setActive = useAuthStore((s) => s.setActiveContract);

  useEffect(() => {
    setLoading(true);
    contractService
      .getMyContracts()
      .then((res) => setContracts(res || []))
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, []);

  const current = contracts.find((c) => c.id === activeContractId) || contracts[0];

  const select = async (id: number) => {
    await setActive(id);
    setOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.selector} onPress={() => setOpen(true)}>
        <View style={styles.leftIcon}><Ionicons name="home-outline" size={18} color="#2563EB" /></View>
        <View style={styles.meta}>
          <Text style={styles.title}>{current ? `${current.roomNumber || 'Phòng'} ${current.contractCode ? `· ${current.contractCode}` : ''}` : 'Chưa chọn hợp đồng'}</Text>
          <Text style={styles.subtitle}>{current ? formatDateRange(current.startDate, current.expectedEndDate) : 'Chọn hợp đồng để hiển thị dữ liệu'}</Text>
        </View>
        <View style={styles.rightArea}>
          {current && <View style={[styles.statusBadge, { backgroundColor: contractStatus(current).color }]} />}
          <Ionicons name="chevron-down" size={18} color="#6B7280" />
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn hợp đồng</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator style={{ marginTop: 12 }} />
            ) : (
              <FlatList
                data={contracts}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => select(item.id)}>
                    <SettingRow
                      icon="document-text-outline"
                      title={`${item.roomNumber || 'Phòng'} ${item.contractCode ? `· ${item.contractCode}` : ''}`}
                      subtitle={`${formatDateRange(item.startDate, item.expectedEndDate)} • ${item.residents?.length || 0} cư dân`}
                      borderBottom
                    />
                    <View style={styles.rowFooter}>
                      <Text style={{ color: contractStatus(item).color, fontWeight: '600' }}>{contractStatus(item).label}</Text>
                      {item.id === activeContractId && <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginLeft: 8 }} />}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => <Text style={{ textAlign: 'center', padding: 12 }}>Không có hợp đồng</Text>}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 5,
    paddingHorizontal: 0,
    borderRadius: 10,
    borderWidth: 0,
  },
  leftIcon: { marginRight: 12 },
  meta: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  rightArea: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { width: 10, height: 10, borderRadius: 6, marginRight: 8 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 8, maxHeight: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  rowFooter: { paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
