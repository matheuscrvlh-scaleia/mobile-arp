import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useScreenFocused } from "../useScreenFocused";
import { Icon } from "./Icon";

export type SpinnerProps = {
  size?: number;
  /** Padrão: `text` do tema (o do Icon). */
  color?: string;
  accessibilityLabel?: string;
};

/**
 * loader-circle girando (`animation: spin .8s linear infinite`). Para quando a tela perde o
 * foco; com movimento reduzido fica parado (o ícone já diz "carregando").
 */
export function Spinner({ size = 20, color, accessibilityLabel = "Carregando" }: SpinnerProps) {
  const turn = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const focused = useScreenFocused();
  const animate = focused && !reduceMotion;

  useEffect(() => {
    if (!animate) return;
    // continua do ângulo em que parou
    const from = turn.get() % 360;
    turn.set(from);
    turn.set(
      withRepeat(withTiming(from + 360, { duration: 800, easing: Easing.linear }), -1, false),
    );
    return () => cancelAnimation(turn);
  }, [animate, turn]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.get()}deg` }] }));

  return (
    <Animated.View
      style={style}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
    >
      <Icon name="loader-circle" size={size} color={color} />
    </Animated.View>
  );
}
