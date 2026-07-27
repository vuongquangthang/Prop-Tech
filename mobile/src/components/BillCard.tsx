import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius } from '../theme/palette';

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
    <TouchableOpacity onPress={onPress} style={[styles.container, isActive && styles.containerActive]} activeOpacity={0.86}>
      <View style={[styles.accentBar, isActive && styles.accentBarActive]} />
      <View style={styles.content}>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <View style={styles.billIcon}>
              <Ionicons name="receipt-outline" size={16} color={isActive ? palette.primary : palette.textMuted} />
            </View>
            <Text style={styles.month}>Hóa đơn {month}</Text>
          </View>
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
        <View style={styles.chevronCircle}>
          <Ionicons name="chevron-forward" size={17} color={palette.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 4,
    overflow: 'hidden',
  },
  containerActive: {
    borderColor: '#A7E1FF',
    backgroundColor: '#FBFDFF',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: palette.borderSoft,
  },
  accentBarActive: {
    backgroundColor: palette.primary,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  billIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
    fontWeight: '700',
    color: palette.primary,
  },
  activeAmount: {
    color: palette.secondary,
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
