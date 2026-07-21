import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/palette';

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
        <Ionicons name={icon as any} size={20} color={palette.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: palette.surface,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  iconContainer: {
    marginRight: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: palette.primarySoft,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.text,
  },
  subtitle: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 2,
  },
});
