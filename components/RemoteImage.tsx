import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image, type ImageProps as ExpoImageProps } from 'expo-image';
import { enhanceRemoteImageUrl, normalizeRemoteImageUri } from '@/lib/imageUri';

export type RemoteImageProps = Omit<ExpoImageProps, 'source'> & { uri: unknown };

/** Renders a remote image when `uri` resolves to a non-empty URL; otherwise an empty clipped view. */
export function RemoteImage({ uri, style, contentFit = 'cover', ...rest }: RemoteImageProps) {
  const raw = normalizeRemoteImageUri(uri);
  const src = raw ? enhanceRemoteImageUrl(raw) : null;

  if (!src) {
    return <View style={[style, styles.clip]} />;
  }

  return (
    <View style={[style, styles.clip]}>
      <Image
        key={src}
        recyclingKey={src}
        source={{ uri: src }}
        style={[StyleSheet.absoluteFill, styles.image]}
        contentFit={contentFit}
        cachePolicy="memory-disk"
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});
