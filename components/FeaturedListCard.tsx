import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { RecipeList } from '@/types';
import { Colors, Spacing, BorderRadius, FontSize, Fonts } from '@/constants/Colors';
import { RemoteImage } from '@/components/RemoteImage';

const CARD_WIDTH = Dimensions.get('window').width * 0.6;
const CARD_HEIGHT = 180;

interface FeaturedListCardProps {
  list: RecipeList;
  onPress?: () => void;
}

export function FeaturedListCard({ list, onPress }: FeaturedListCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <RemoteImage uri={list.image} style={styles.image} />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{list.title}</Text>
        {list.userProgress && (
          <Text style={styles.progress}>
            You've made {list.userProgress.tried} of {list.userProgress.total}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: Fonts.bodyBold,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  progress: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Fonts.bodyMedium,
    fontWeight: '500',
  },
});
