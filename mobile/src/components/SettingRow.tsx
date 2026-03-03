import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  borderBottom?: boolean;
  onPress?: () => void;
}

export function SettingRow({ icon, title, subtitle, borderBottom, onPress }: SettingRowProps) {
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container 
      onPress={onPress}
      style={[styles.container, borderBottom && styles.borderBottom]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={20} color="#9CA3AF" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
