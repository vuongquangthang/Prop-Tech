import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/palette';

interface BillCardProps {
  month: string;
  roomLabel?: string;
  status: string;
  amount: string;
  isActive?: boolean;
  onPress: () => void;
}

export function BillCard({ month, roomLabel, status, amount, isActive, onPress }: BillCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.month}>Hóa đơn {month}</Text>
          {roomLabel && (
            <View style={styles.roomRow}>
              <Ionicons name="home-outline" size={14} color={palette.primary} />
              <Text style={styles.roomText}>{roomLabel}</Text>
            </View>
          )}
          <Text style={styles.status}>{status}</Text>
          <Text style={[styles.amount, isActive && styles.activeAmount]}>
            {amount}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  month: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    color: palette.textMuted,
    marginBottom: 8,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  roomText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.primary,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.primary,
  },
  activeAmount: {
    color: palette.secondary,
  },
});
