import { useEffect, useState } from "react";
import {
  type LayoutChangeEvent,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { easings } from "../easings";
import { createStyles } from "../theme/createStyles";
import { useColors } from "../theme/ThemeProvider";
import { fontFamily } from "../tokens";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
  /** Bolinha com contagem (.segm .count) */
  count?: number;
};

export type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Sem margem própria: o CSS usa `margin: 0 20px`, aplique pelo `style`. */
  style?: StyleProp<ViewStyle>;
};

const PAD = 4;

/** Controle segmentado (.segm) com o "polegar" elevado (surfaceRaised) deslizando com mola. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedProps<T>) {
  const colors = useColors();
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const n = Math.max(1, options.length);
  const segW = width > 0 ? (width - PAD * 2) / n : 0;
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const x = useSharedValue(0);
  useEffect(() => {
    x.set(withTiming(index * segW, { duration: 350, easing: easings.spring }));
  }, [index, segW, x]);

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={[styles.wrap, style]} onLayout={onLayout} accessibilityRole="tablist">
      {segW > 0 ? <Animated.View style={[styles.thumb, { width: segW }, thumb]} /> : null}
      {options.map((o) => {
        const on = o.value === value;
        const fg = on ? colors.text : colors.textMuted;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.count != null ? `${o.label}, ${o.count}` : o.label}
            style={styles.btn}
          >
            {o.icon ? <Icon name={o.icon} size={20} color={fg} /> : null}
            <Text style={styles.label} color={fg} numberOfLines={1}>
              {o.label}
            </Text>
            {o.count != null ? (
              <View style={styles.count}>
                <Text style={styles.countText} color={colors.onInverse} tabular>
                  {o.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrap: {
    flexDirection: "row",
    backgroundColor: t.colors.surface,
    borderRadius: 18,
    padding: PAD,
  },
  thumb: {
    position: "absolute",
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: 14,
    backgroundColor: t.colors.surfaceRaised,
    ...t.shadows.segThumb,
  },
  btn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  label: { fontFamily: fontFamily(650), fontSize: 14, lineHeight: 18 },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: t.colors.inverse,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontFamily: fontFamily(650), fontSize: 11, lineHeight: 14 },
}));
