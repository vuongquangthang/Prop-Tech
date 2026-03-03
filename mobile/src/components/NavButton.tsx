import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export function NavButton({ icon, label, isActive, onPress }: NavButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
    >
      <View style={[styles.iconContainer, isActive && styles.activeIcon]}>
        {icon}
      </View>
      <Text style={[styles.label, isActive && styles.activeLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  iconContainer: {
    padding: 4,
  },
  activeIcon: {
    // Active state handled by icon color
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    color: '#9CA3AF',
  },
  activeLabel: {
    color: '#2563EB',
  },
});
