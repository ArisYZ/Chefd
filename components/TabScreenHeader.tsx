import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Spacing, TabHeaderTitle } from '@/constants/Colors';

type TabScreenHeaderProps = {
  title: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function TabScreenHeader({ title, right, style }: TabScreenHeaderProps) {
  return (
    <View style={[styles.bar, style]}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {right != null ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    ...TabHeaderTitle,
    flexShrink: 1,
    flex: 1,
    marginRight: Spacing.md,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
});
