import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MakeAgain } from '@/types';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors';

const CONFIG: Record<MakeAgain, { icon: string; label: string; bg: string; fg: string }> = {
  yes: { icon: 'checkmark-circle', label: 'Would make again', bg: '#E8F5E9', fg: '#2E7D32' },
  maybe: { icon: 'help-circle', label: 'Maybe again', bg: '#FFF8E1', fg: '#F9A825' },
  no: { icon: 'close-circle', label: "Wouldn't make again", bg: '#FFEBEE', fg: '#C62828' },
};

interface MakeAgainBadgeProps {
  value: MakeAgain;
  compact?: boolean;
}

export function MakeAgainBadge({ value, compact = false }: MakeAgainBadgeProps) {
  const c = CONFIG[value];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon as any} size={compact ? 14 : 16} color={c.fg} />
      {!compact && <Text style={[styles.label, { color: c.fg }]}>{c.label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
