import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { contractService } from '../services/contract.service';
import { useAuthStore } from '../store/authStore';
import { palette, radius } from '../theme/palette';

function formatDateRange(start?: string, end?: string | null) {
  if (!start) return 'Không rõ';
  const s = new Date(start).toLocaleDateString('vi-VN');
  if (!end) return `Từ ${s}`;
  const e = new Date(end).toLocaleDateString('vi-VN');
  return `${s} → ${e}`;
}

function contractStatus(contract: any) {
  if (!contract) return { label: 'Không rõ', color: palette.textMuted, bgColor: palette.surfaceSoft };
  const today = new Date();
  const start = new Date(contract.startDate);
  const end = contract.expectedEndDate ? new Date(contract.expectedEndDate) : null;
  if (end && today > end) return { label: 'Hết hạn', color: palette.danger, bgColor: palette.dangerSoft };
  if (start > today) return { label: 'Sắp bắt đầu', color: palette.primary, bgColor: palette.primarySoft };
  if (end) {
    const daysLeft = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) return { label: `Còn ${daysLeft} ngày`, color: palette.accent, bgColor: palette.accentSoft };
  }
  return { label: 'Đang hoạt động', color: palette.secondary, bgColor: palette.secondarySoft };
}

export default function ContractPicker() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const activeContractId = useAuthStore((s) => s.activeContractId);
  const setActive = useAuthStore((s) => s.setActiveContract);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    contractService
      .getMyContracts()
      .then(async (res) => {
        if (!mounted) return;
        const items = res || [];
        setContracts(items);

        const hasActiveContract = activeContractId != null
          && items.some((contract) => contract.id === activeContractId);
        if (!hasActiveContract && items[0]?.id) {
          await setActive(items[0].id);
        }
      })
      .catch(() => {
        if (mounted) setContracts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeContractId, setActive]);

  const current = contracts.find((c) => c.id === activeContractId) || contracts[0];
  const currentStatus = contractStatus(current);

  const select = async (id: number) => {
    await setActive(id);
    setOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.selector} onPress={() => setOpen(true)} activeOpacity={0.88}>
        <View style={styles.selectorGlow} />
        <View style={styles.selectorHeader}>
          <View style={styles.leftIcon}>
            <Ionicons name="document-text" size={18} color="#FFFFFF" />
          </View>
          <View style={[styles.statusPill, { backgroundColor: currentStatus.bgColor }]}>
            <Text style={[styles.statusPillText, { color: currentStatus.color }]}>{currentStatus.label}</Text>
          </View>
        </View>

        <View style={styles.meta}>
          <Text style={styles.kicker}>Hợp đồng đang xem</Text>
          <Text style={styles.title} numberOfLines={1}>
            {current ? `${current.roomNumber || 'Phòng'}${current.contractCode ? ` · ${current.contractCode}` : ''}` : 'Chưa chọn hợp đồng'}
          </Text>
          <View style={styles.subtitleRow}>
            <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.76)" />
            <Text style={styles.subtitle} numberOfLines={1}>
              {current ? formatDateRange(current.startDate, current.expectedEndDate) : 'Chọn hợp đồng để hiển thị dữ liệu'}
            </Text>
          </View>
          <View style={styles.subtitleRow}>
            <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.76)" />
            <Text style={styles.subtitle}>
              {current ? `${current.residents?.length || 0} cư dân liên quan` : 'Chưa có dữ liệu cư dân'}
            </Text>
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Đổi hợp đồng</Text>
          <View style={styles.switchIcon}>
            <Ionicons name="chevron-down" size={16} color={palette.primaryDark} />
          </View>
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Chọn hợp đồng</Text>
                <Text style={styles.modalSubtitle}>Dữ liệu app sẽ hiển thị theo hợp đồng được chọn.</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color={palette.text} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator style={{ marginVertical: 24 }} color={palette.primary} />
            ) : (
              <FlatList
                data={contracts}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => select(item.id)}
                    style={[styles.contractOption, item.id === activeContractId && styles.contractOptionActive]}
                    activeOpacity={0.86}
                  >
                    <View style={styles.optionIcon}>
                      <Ionicons name="home-outline" size={18} color={palette.primary} />
                    </View>
                    <View style={styles.optionMeta}>
                      <Text style={styles.optionTitle} numberOfLines={1}>
                        {item.roomNumber || 'Phòng'} {item.contractCode ? `· ${item.contractCode}` : ''}
                      </Text>
                      <Text style={styles.optionSubtitle} numberOfLines={1}>
                        {formatDateRange(item.startDate, item.expectedEndDate)}
                      </Text>
                      <View style={styles.optionFooter}>
                        <Text style={[styles.optionStatus, { color: contractStatus(item).color }]}>
                          {contractStatus(item).label}
                        </Text>
                        <Text style={styles.optionResident}>{item.residents?.length || 0} cư dân</Text>
                      </View>
                    </View>
                    {item.id === activeContractId && (
                      <Ionicons name="checkmark-circle" size={22} color={palette.secondary} />
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={() => <Text style={styles.emptyText}>Không có hợp đồng</Text>}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  selector: {
    position: 'relative',
    backgroundColor: palette.primaryDark,
    padding: 16,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#38BDF8',
    shadowColor: palette.shadowStrong,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 7,
  },
  selectorGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    right: -60,
    top: -70,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  leftIcon: {
    width: 38,
    height: 38,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  meta: { flex: 1 },
  kicker: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.64)', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginTop: 4, marginBottom: 8 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.76)', flex: 1 },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  switchRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switchText: { fontSize: 13, fontWeight: '800', color: palette.primaryDark },
  switchIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(8, 20, 35, 0.48)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: palette.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 16, maxHeight: '78%' },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: palette.border, alignSelf: 'center', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: palette.borderSoft },
  modalTitle: { fontSize: 18, fontWeight: '800', color: palette.text },
  modalSubtitle: { fontSize: 12, color: palette.textMuted, marginTop: 4 },
  closeButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: palette.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingTop: 12, paddingBottom: 10 },
  contractOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
  },
  contractOptionActive: {
    backgroundColor: '#F6FBFF',
    borderColor: '#A7E1FF',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionMeta: { flex: 1 },
  optionTitle: { fontSize: 14, fontWeight: '800', color: palette.text },
  optionSubtitle: { fontSize: 12, color: palette.textMuted, marginTop: 3 },
  optionFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  optionStatus: { fontSize: 11, fontWeight: '800' },
  optionResident: { fontSize: 11, color: palette.textMuted },
  emptyText: { textAlign: 'center', padding: 18, color: palette.textMuted, fontWeight: '600' },
});
