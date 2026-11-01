import { memo, useEffect } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { easings } from "../easings";
import { createStyles } from "../theme/createStyles";
import { useColors } from "../theme/ThemeProvider";
import { hitSlop } from "../tokens";

export type SwitchProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel: string;
  /** Sobre chrome/fundo escuro fixo (.dark .sw): trilho `switchOffOnChrome`. */
  dark?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Interruptor 46×28 (.sw). Dentro de um cartão clicável, o toque não chega ao cartão. */
export const Switch = memo(function Switch({
  value,
  onValueChange,
  accessibilityLabel,
  dark = false,
  disabled,
  style,
}: SwitchProps) {
  const colors = useColors();
  const styles = useStyles();
  const p = useSharedValue(value ? 1 : 0);
  const off = dark ? colors.switchOffOnChrome : colors.switchOff;
  const on = colors.brand;

  useEffect(() => {
    p.set(withTiming(value ? 1 : 0, { duration: 350, easing: easings.spring }));
  }, [value, p]);

  const track = useAnimatedStyle(() => ({
    // a cor usa só o progresso limitado: a mola passa de 1 e a cor não pode "estourar"
    backgroundColor: interpolateColor(Math.min(1, Math.max(0, p.get())), [0, 1], [off, on]),
  }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: p.get() * 18 }] }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      hitSlop={hitSlop.sm}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      style={[disabled && styles.disabled, style]}
    >
      <Animated.View style={[styles.track, track]}>
        <Animated.View style={[styles.knob, knob]} />
      </Animated.View>
    </Pressable>
  );
});

const useStyles = createStyles((t) => ({
  track: { width: 46, height: 28, borderRadius: 14 },
  knob: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: t.colors.switchKnob,
    ...t.shadows.knob,
  },
  disabled: { opacity: 0.45 },
}));
