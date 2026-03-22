import React, { useEffect } from 'react';
import { Pressable, View, type GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Colors } from '@/constants/Colors';

const PRESS_SPRING = { damping: 16, stiffness: 400, mass: 0.35 };

export const LeaderboardTabBarButton = React.forwardRef<View, BottomTabBarButtonProps>(
  function LeaderboardTabBarButton(
    { children, style, onPressIn, onPressOut, ...rest },
    ref,
  ) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = (e: GestureResponderEvent) => {
      scale.value = withSpring(0.88, PRESS_SPRING);
      onPressIn?.(e);
    };

    const handlePressOut = (e: GestureResponderEvent) => {
      scale.value = withSpring(1, PRESS_SPRING);
      onPressOut?.(e);
    };

    return (
      <Pressable
        ref={ref}
        {...rest}
        style={style}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: `${Colors.primary}22`, borderless: true }}
      >
        <Animated.View
          style={[
            { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
            animatedStyle,
          ]}
        >
          {children}
        </Animated.View>
      </Pressable>
    );
  },
);

export function LeaderboardTabIcon({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) {
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 240 });
  }, [focused, focus]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + 0.08 * focus.value }],
  }));

  return (
    <Animated.View style={iconStyle}>
      <Ionicons name="stats-chart-outline" size={size} color={color} />
    </Animated.View>
  );
}
