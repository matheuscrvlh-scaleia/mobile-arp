import type { ReactNode } from "react";
import {
  type GestureResponderEvent,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { easings } from "../easings";
import { motion } from "../tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS = { duration: motion.press, easing: easings.ease };

export type PressableScaleProps = Omit<PressableProps, "style" | "children"> & {
  /** Escala no toque (`transform: scale()` do :active). */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Pressable com o "afundar" do :active do protótipo, animado na UI thread. */
export function PressableScale({
  scaleTo = motion.pressScale.button,
  style,
  onPressIn,
  onPressOut,
  disabled,
  accessibilityRole = "button",
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const handleIn = (e: GestureResponderEvent) => {
    scale.set(withTiming(scaleTo, PRESS));
    onPressIn?.(e);
  };
  const handleOut = (e: GestureResponderEvent) => {
    scale.set(withTiming(1, PRESS));
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      onPressIn={handleIn}
      onPressOut={handleOut}
      style={[style, animated]}
    />
  );
}
