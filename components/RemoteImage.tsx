import React from 'react';
import { Image, ImageProps, View } from 'react-native';
import { normalizeRemoteImageUri } from '@/lib/imageUri';

export type RemoteImageProps = Omit<ImageProps, 'source'> & {
  uri: unknown;
};

export function RemoteImage({ uri, style, ...rest }: RemoteImageProps) {
  const u = normalizeRemoteImageUri(uri);
  if (!u) {
    return <View style={style} />;
  }
  return <Image source={{ uri: u }} style={style} {...rest} />;
}
