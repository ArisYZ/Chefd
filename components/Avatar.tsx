import React from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';
import { defaultAvatarSource } from '@/constants/avatarAsset';

interface AvatarProps {
  /** Remote/local file URI, or omit / null for default blank avatar */
  uri?: string | null;
  size?: number;
}

export function Avatar({ uri, size = 44 }: AvatarProps) {
  const source: ImageSourcePropType =
    uri && uri.length > 0 ? { uri } : defaultAvatarSource;

  return (
    <Image
      source={source}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#E0E0E0',
  },
});
