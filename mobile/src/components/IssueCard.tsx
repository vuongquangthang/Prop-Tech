import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/palette';

interface IssueCardProps {
  tag: string;
  title: string;
  id: string;
  roomLabel?: string;
  status?: { label: string; color: string; bgColor: string };
  onPress: () => void;
}

export function IssueCard({ tag, title, id, roomLabel, status, onPress }: IssueCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.info}>
          <View style={styles.topRow}>
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
            {status && (
              <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            )}
          </View>
          {roomLabel && (
            <View style={styles.roomRow}>
              <Ionicons name="home-outline" size={14} color={palette.primary} />
              <Text style={styles.roomText}>{roomLabel}</Text>
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.id}>{id}</Text>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tagContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: palette.surfaceSoft,
    borderRadius: 999,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 4,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 7,
  },
  roomText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.primary,
  },
  id: {
    fontSize: 12,
    color: palette.textMuted,
  },
});
