import { useEffect } from "react";
import { Pressable, ScrollView, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { easings } from "../easings";
import { createStyles } from "../theme/createStyles";
import { useColors } from "../theme/ThemeProvider";
import { fontFamily, hitSlop, layout, motion, tracking } from "../tokens";
import { Text } from "./Text";

export type TabItem<T extends string> = { value: T; label: string };

export type TabsProps<T extends string> = {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

/** Abas de texto (.tabs) com o tracinho verde que cresce de 0 a 18. Rola na horizontal. */
export function Tabs<T extends string>({ items, value, onChange, style }: TabsProps<T>) {
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {items.map((it) => (
        <Tab
          key={it.value}
          label={it.label}
          on={it.value === value}
          onPress={() => onChange(it.value)}
        />
      ))}
    </ScrollView>
  );
}

function Tab({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const colors = useColors();
  const styles = useStyles();
  const width = useSharedValue(on ? 18 : 0);

  useEffect(() => {
    width.set(withTiming(on ? 18 : 0, { duration: motion.base, easing: easings.spring }));
  }, [on, width]);

  const bar = useAnimatedStyle(() => ({ width: width.get() }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop.sm}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      style={styles.tab}
    >
      <Text
        style={[styles.label, on && styles.labelOn]}
        color={on ? colors.text : colors.textMuted}
      >
        {label}
      </Text>
      <Animated.View style={[styles.bar, bar]} />
    </Pressable>
  );
}

const useStyles = createStyles((t) => ({
  row: { gap: 24, paddingHorizontal: layout.gutter },
  tab: { paddingTop: 6, paddingBottom: 12, alignItems: "center" },
  label: {
    fontFamily: fontFamily(600),
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: tracking(17, -0.01),
  },
  labelOn: { fontFamily: fontFamily(750) },
  bar: {
    position: "absolute",
    bottom: 2,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.colors.brand,
  },
}));
