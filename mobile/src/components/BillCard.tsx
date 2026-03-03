import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BillCardProps {
  month: string;
  status: string;
  amount: string;
  isActive?: boolean;
  onPress: () => void;
}

export function BillCard({ month, status, amount, isActive, onPress }: BillCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.month}>Hóa đơn {month}</Text>
          <Text style={styles.status}>{status}</Text>
          <Text style={[styles.amount, isActive && styles.activeAmount]}>
            {amount}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#111827',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  activeAmount: {
    color: '#2563EB',
  },
});
