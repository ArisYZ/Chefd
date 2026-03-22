import React from 'react';
import { Image, ImageProps, StyleSheet, View } from 'react-native';
import { enhanceRemoteImageUrl, normalizeRemoteImageUri } from '@/lib/imageUri';

export type RemoteImageProps = Omit<ImageProps, 'source'> & {
  uri: unknown;
};

/** Renders a remote image when `uri` resolves to a non-empty URL; otherwise an empty clipped view. */
export function RemoteImage({ uri, style, ...rest }: RemoteImageProps) {
  const raw = normalizeRemoteImageUri(uri);
  const src = raw ? enhanceRemoteImageUrl(raw) : null;

  if (!src) {
    return <View style={[style, styles.clip]} />;
  }

  return (
    <View style={[style, styles.clip]}>
      <Image
        source={{ uri: src }}
        style={[StyleSheet.absoluteFill, styles.image]}
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
