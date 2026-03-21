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
      contentContainerStyle={styles.container}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.label;
        return (
          <TouchableOpacity
            key={tab.label}
            style={[styles.tab, isActive && styles.activeTab]}
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
            <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
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
    fontWeight: '500',
    color: Colors.text,
  },
  activeLabel: {
    color: Colors.white,
  },
});
