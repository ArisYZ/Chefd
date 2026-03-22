import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants/Colors';

interface FilterTabsProps {
  tabs: { label: string; icon?: string }[];
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export function FilterTabs({ tabs, activeTab, onTabPress }: FilterTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.label;
        return (
          <TouchableOpacity
            key={tab.label}
            style={[
              styles.tab,
              index < tabs.length - 1 && styles.tabSpacing,
              isActive && styles.activeTab,
            ]}
            onPress={() => onTabPress(tab.label)}
            activeOpacity={0.7}
          >
            {tab.icon && (
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={isActive ? Colors.white : Colors.text}
                style={styles.icon}
              />
            )}
            <Text style={[styles.label, isActive && styles.activeLabel]} numberOfLines={1}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const CHIP_MIN_HEIGHT = 36;

const styles = StyleSheet.create({
  /** Horizontal ScrollView must not expand vertically in a flex column (RN Web). */
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  /** Avoid `gap` on horizontal ScrollView — unreliable on RN Web and can clip or hide children. */
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  tabSpacing: {
    marginRight: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    minHeight: CHIP_MIN_HEIGHT,
    paddingHorizontal: Spacing.md,
    paddingVertical: 0,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    lineHeight: Math.round(FontSize.sm * 1.25),
    fontWeight: '500',
    color: Colors.text,
  },
  activeLabel: {
    color: Colors.white,
  },
});
