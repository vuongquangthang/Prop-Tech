import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RecordUtilityReading,
  RoomUtilityReading,
  utilityReadingService,
} from '../../services/utility-reading.service';
import { palette, radius } from '../../theme/palette';

type RowEdit = {
  elec: string;
  water: string;
};

const onlyDigits = (value: string) => value.replace(/[^0-9]/g, '');

const formatNumber = (value?: number | null) => {
  if (value == null) return '—';
  return Number(value).toLocaleString('vi-VN');
};

const currentDate = new Date();

export default function AdminUtilityReadingsScreen() {
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [rooms, setRooms] = useState<RoomUtilityReading[]>([]);
  const [edits, setEdits] = useState<Record<number, RowEdit>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('Tất cả');
  const [floorFilter, setFloorFilter] = useState('Tất cả');
  const [openFilter, setOpenFilter] = useState<'building' | 'floor' | null>(null);

  const loadReadings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await utilityReadingService.getMonthReadings(selectedYear, selectedMonth);
      setRooms(data);
      const nextEdits: Record<number, RowEdit> = {};
      data.forEach((room) => {
        nextEdits[room.roomId] = {
          elec: room.newElecReading != null ? String(Math.trunc(room.newElecReading)) : '',
          water: room.newWaterReading != null ? String(Math.trunc(room.newWaterReading)) : '',
        };
      });
      setEdits(nextEdits);
    } catch (error: any) {
      Alert.alert('Không tải được dữ liệu', error?.message || 'Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    void loadReadings();
  }, [loadReadings]);

  const buildingOptions = useMemo(() => {
    const values = rooms.map((room) => room.buildingName).filter(Boolean) as string[];
    return ['Tất cả', ...Array.from(new Set(values))];
  }, [rooms]);

  const floorOptions = useMemo(() => {
    const values = rooms
      .filter((room) => buildingFilter === 'Tất cả' || room.buildingName === buildingFilter)
      .map((room) => room.floorName)
      .filter(Boolean) as string[];
    return ['Tất cả', ...Array.from(new Set(values))];
  }, [buildingFilter, rooms]);

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchBuilding = buildingFilter === 'Tất cả' || room.buildingName === buildingFilter;
      const matchFloor = floorFilter === 'Tất cả' || room.floorName === floorFilter;
      const matchSearch =
        !query ||
        room.roomCode.toLowerCase().includes(query) ||
        (room.residentName || '').toLowerCase().includes(query);
      return matchBuilding && matchFloor && matchSearch;
    });
  }, [buildingFilter, floorFilter, rooms, search]);

  const stats = useMemo(() => {
    const done = rooms.filter((room) => room.elecRecorded || room.waterRecorded).length;
    const abnormal = rooms.filter((room) => room.elecIsAnomaly || room.waterIsAnomaly).length;
    return {
      total: rooms.length,
      done,
      pending: Math.max(rooms.length - done, 0),
      abnormal,
    };
  }, [rooms]);

  const handleChange = (roomId: number, field: keyof RowEdit, value: string) => {
    const sanitized = onlyDigits(value);
    setEdits((prev) => ({
      ...prev,
      [roomId]: {
        elec: prev[roomId]?.elec || '',
        water: prev[roomId]?.water || '',
        [field]: sanitized,
      },
    }));
  };

  const getUsage = (room: RoomUtilityReading, field: keyof RowEdit) => {
    const raw = edits[room.roomId]?.[field];
    if (!raw) return null;
    const nextValue = parseInt(raw, 10);
    const oldValue = field === 'elec' ? room.oldElecReading ?? 0 : room.oldWaterReading ?? 0;
    return nextValue - oldValue;
  };

  const validateRows = () => {
    const errors: string[] = [];
    const payload = filteredRooms.reduce<RecordUtilityReading[]>((acc, room) => {
        const edit = edits[room.roomId];
        const hasElec = !!edit?.elec;
        const hasWater = !!edit?.water;
        if (!hasElec && !hasWater) return acc;

        const elecValue = hasElec ? parseInt(edit.elec, 10) : undefined;
        const waterValue = hasWater ? parseInt(edit.water, 10) : undefined;
        if (elecValue != null && elecValue < (room.oldElecReading ?? 0)) {
          errors.push(`${room.roomCode}: chỉ số điện mới nhỏ hơn chỉ số cũ`);
        }
        if (waterValue != null && waterValue < (room.oldWaterReading ?? 0)) {
          errors.push(`${room.roomCode}: chỉ số nước mới nhỏ hơn chỉ số cũ`);
        }

        acc.push({
          roomId: room.roomId,
          month: selectedMonth,
          year: selectedYear,
          elecUsageDetailId: room.elecUsageDetailId,
          waterUsageDetailId: room.waterUsageDetailId,
          newElecReading: elecValue,
          newWaterReading: waterValue,
        });
        return acc;
      }, []);

    return { errors, payload };
  };

  const handleSave = async () => {
    const { errors, payload } = validateRows();
    if (errors.length > 0) {
      Alert.alert('Kiểm tra lại chỉ số', errors.slice(0, 5).join('\n'));
      return;
    }
    if (payload.length === 0) {
      Alert.alert('Chưa có dữ liệu', 'Bạn chưa nhập chỉ số phòng nào.');
      return;
    }

    setSaving(true);
    try {
      const result = await utilityReadingService.recordBatch(payload);
      await loadReadings();
      Alert.alert(
        'Đã lưu chỉ số',
        `Thành công: ${result.success}\nLỗi: ${result.failed}${
          result.warnings?.length ? `\n\nCảnh báo:\n${result.warnings.slice(0, 3).join('\n')}` : ''
        }`,
      );
    } catch (error: any) {
      Alert.alert('Không lưu được chỉ số', error?.message || 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const shiftMonth = (direction: -1 | 1) => {
    const next = new Date(selectedYear, selectedMonth - 1 + direction, 1);
    setSelectedMonth(next.getMonth() + 1);
    setSelectedYear(next.getFullYear());
  };

  const renderDropdown = (
    label: string,
    value: string,
    type: 'building' | 'floor',
    options: string[],
    onSelect: (option: string) => void,
  ) => {
    const isOpen = openFilter === type;
    return (
      <View style={styles.dropdownWrap}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, isOpen && styles.dropdownButtonActive]}
          activeOpacity={0.85}
          onPress={() => setOpenFilter((current) => (current === type ? null : type))}
        >
          <Text style={styles.dropdownValue} numberOfLines={1}>{value}</Text>
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={17} color="#475569" />
        </TouchableOpacity>
        {isOpen && (
          <View style={styles.dropdownMenu}>
            <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.dropdownItem, value === option && styles.dropdownItemActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    onSelect(option);
                    setOpenFilter(null);
                  }}
                >
                  <Text style={[styles.dropdownItemText, value === option && styles.dropdownItemTextActive]}>
                    {option}
                  </Text>
                  {value === option && <Ionicons name="checkmark" size={17} color={palette.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderRoom = ({ item }: { item: RoomUtilityReading }) => {
    const edit = edits[item.roomId] || { elec: '', water: '' };
    const elecUsage = getUsage(item, 'elec');
    const waterUsage = getUsage(item, 'water');
    const hasInvalidElec = elecUsage != null && elecUsage < 0;
    const hasInvalidWater = waterUsage != null && waterUsage < 0;

    return (
      <View style={styles.roomCard}>
        <View style={styles.roomHeader}>
          <View style={styles.roomTitleWrap}>
            <Text style={styles.roomCode}>{item.roomCode}</Text>
            <Text style={styles.roomMeta}>
              {[item.buildingName, item.floorName, item.residentName].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <View style={[styles.statusPill, item.elecRecorded || item.waterRecorded ? styles.statusDone : styles.statusPending]}>
            <Text style={[styles.statusText, item.elecRecorded || item.waterRecorded ? styles.statusTextDone : styles.statusTextPending]}>
              {item.elecRecorded || item.waterRecorded ? 'Đã nhập' : 'Chưa nhập'}
            </Text>
          </View>
        </View>

        <View style={styles.meterGrid}>
          <View style={styles.meterBox}>
            <Text style={styles.meterLabel}>Điện cũ</Text>
            <Text style={styles.meterOld}>{formatNumber(item.oldElecReading)}</Text>
            <TextInput
              value={edit.elec}
              onChangeText={(value) => handleChange(item.roomId, 'elec', value)}
              keyboardType="number-pad"
              placeholder="Điện mới"
              style={[styles.input, hasInvalidElec && styles.inputError]}
            />
            <Text style={[styles.usageText, hasInvalidElec && styles.errorText]}>
              {elecUsage == null ? 'Tiêu thụ: —' : `Tiêu thụ: ${formatNumber(elecUsage)}`}
            </Text>
          </View>

          <View style={styles.meterBox}>
            <Text style={styles.meterLabel}>Nước cũ</Text>
            <Text style={styles.meterOld}>{formatNumber(item.oldWaterReading)}</Text>
            <TextInput
              value={edit.water}
              onChangeText={(value) => handleChange(item.roomId, 'water', value)}
              keyboardType="number-pad"
              placeholder="Nước mới"
              style={[styles.input, hasInvalidWater && styles.inputError]}
            />
            <Text style={[styles.usageText, hasInvalidWater && styles.errorText]}>
              {waterUsage == null ? 'Tiêu thụ: —' : `Tiêu thụ: ${formatNumber(waterUsage)}`}
            </Text>
          </View>
        </View>

        {(item.elecIsAnomaly || item.waterIsAnomaly || hasInvalidElec || hasInvalidWater) && (
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={18} color="#b45309" />
            <Text style={styles.warningText}>
              {hasInvalidElec || hasInvalidWater
                ? 'Có chỉ số mới nhỏ hơn chỉ số cũ.'
                : item.elecAnomalyNote || item.waterAnomalyNote || 'Chỉ số có dấu hiệu bất thường.'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Chốt điện/nước</Text>
          <Text style={styles.subtitle}>Tháng {selectedMonth}/{selectedYear}</Text>
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving || loading}>
          {saving ? (
            <ActivityIndicator size="small" color={palette.surface} />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color={palette.surface} />
              <Text style={styles.saveButtonText}>Lưu</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.monthRow}>
        <TouchableOpacity style={styles.monthButton} onPress={() => shiftMonth(-1)}>
          <Ionicons name="chevron-back" size={20} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{String(selectedMonth).padStart(2, '0')}/{selectedYear}</Text>
        <TouchableOpacity style={styles.monthButton} onPress={() => shiftMonth(1)}>
          <Ionicons name="chevron-forward" size={20} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Phòng</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Chưa nhập</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.abnormal}</Text>
          <Text style={styles.statLabel}>Bất thường</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={palette.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm mã phòng hoặc tên cư dân"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterBlock}>
        {renderDropdown('Tòa nhà', buildingFilter, 'building', buildingOptions, (option) => {
          setBuildingFilter(option);
          setFloorFilter('Tất cả');
        })}
        {renderDropdown('Tầng', floorFilter, 'floor', floorOptions, (option) => setFloorFilter(option))}
      </View>

      {loading && rooms.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => String(item.roomId)}
          renderItem={renderRoom}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadReadings} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="home-outline" size={34} color="#94a3b8" />
              <Text style={styles.emptyTitle}>Không có phòng phù hợp</Text>
              <Text style={styles.emptyText}>Thử bỏ lọc hoặc tìm mã phòng khác.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  saveButton: {
    minWidth: 62,
    height: 32,
    borderRadius: 10,
    backgroundColor: palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  saveButtonText: {
    color: palette.surface,
    fontWeight: '800',
  },
  monthRow: {
    marginHorizontal: 10,
    marginBottom: 5,
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  monthButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: palette.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    minWidth: 120,
    textAlign: 'center',
    color: palette.text,
    fontSize: 12,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 5,
    marginBottom: 5,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: palette.borderSoft,
  },
  statValue: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '900',
  },
  statLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  searchBox: {
    marginHorizontal: 10,
    marginBottom: 6,
    height: 36,
    borderRadius: 11,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: palette.text,
    fontSize: 12,
  },
  filterBlock: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 10,
    marginBottom: 6,
    zIndex: 10,
  },
  dropdownWrap: {
    flex: 1,
    position: 'relative',
    zIndex: 20,
  },
  dropdownLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 3,
  },
  dropdownButton: {
    height: 36,
    borderRadius: 11,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  dropdownButtonActive: {
    borderColor: '#93c5fd',
    backgroundColor: '#f8fbff',
  },
  dropdownValue: {
    flex: 1,
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    maxHeight: 190,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    shadowColor: palette.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 30,
  },
  dropdownScroll: {
    maxHeight: 190,
  },
  dropdownItem: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  dropdownItemActive: {
    backgroundColor: palette.primarySoft,
  },
  dropdownItemText: {
    flex: 1,
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownItemTextActive: {
    color: palette.primary,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: palette.textMuted,
    marginTop: 12,
  },
  listContent: {
    padding: 10,
    paddingBottom: 84,
  },
  roomCard: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  roomTitleWrap: {
    flex: 1,
  },
  roomCode: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '900',
  },
  roomMeta: {
    color: palette.textMuted,
    fontSize: 10,
    marginTop: 3,
    lineHeight: 15,
  },
  statusPill: {
    height: 23,
    borderRadius: 15,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  statusDone: {
    backgroundColor: palette.successSoft,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextDone: {
    color: '#166534',
  },
  statusTextPending: {
    color: '#92400e',
  },
  meterGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  meterBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 11,
    padding: 8,
  },
  meterLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  meterOld: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 7,
  },
  input: {
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: 9,
    color: palette.text,
    fontSize: 12,
    fontWeight: '800',
  },
  inputError: {
    borderColor: palette.danger,
    backgroundColor: palette.dangerSoft,
  },
  usageText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  errorText: {
    color: palette.danger,
  },
  warningBox: {
    marginTop: 12,
    borderRadius: 16,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#fde68a',
    flexDirection: 'row',
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: '#92400e',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyText: {
    color: palette.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
});
