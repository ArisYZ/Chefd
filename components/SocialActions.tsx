import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '@/constants/Colors';

interface SocialActionsProps {
  likes: number;
  comments: number;
  liked: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export function SocialActions({
  likes,
  comments,
  liked: initialLiked,
  onLike,
  onComment,
  onShare,
  onBookmark,
  isBookmarked,
}: SocialActionsProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    onLike?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        <TouchableOpacity onPress={handleLike} style={styles.action} activeOpacity={0.7}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? Colors.heart : Colors.text}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onComment} style={styles.action} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onShare} style={styles.action} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity activeOpacity={0.7} onPress={onBookmark}>
        <Ionicons
          name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
          size={24}
          color={isBookmarked ? Colors.primary : Colors.textTertiary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  action: {
    padding: 2,
  },
});
