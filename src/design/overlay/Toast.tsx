import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useStore } from "zustand";
import { useTabBarInset } from "../components/BottomSpacer";
import { Icon } from "../components/Icon";
import { Text } from "../components/Text";
import { createStyles } from "../theme/createStyles";
import { useColors } from "../theme/ThemeProvider";
import { fontFamily } from "../tokens";
import { overlayStore, type ToastEntry } from "./store";

/* @keyframes toast (2.6s): entra em 10%, fica até 85%, sai. Aqui sobe de baixo, acima da barra de abas. */
const IN = 260;
const HOLD = 1950;
const OUT = 390;

/** Aviso atual (.toast). Montado uma vez pelo OverlayHost. */
export function Toast() {
  const entry = useStore(overlayStore, (s) => s.toast);
  if (!entry) return null;
  return <ToastView key={entry.id} entry={entry} />;
}

function ToastView({ entry }: { entry: ToastEntry }) {
  const colors = useColors();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const { bottom, height } = useTabBarInset();
  const o = useSharedValue(0);
  const ty = useSharedValue(20);
  const s = useSharedValue(0.9);

  useEffect(() => {
    o.set(
      withSequence(
        withTiming(1, { duration: IN }),
        withDelay(HOLD, withTiming(0, { duration: OUT })),
      ),
    );
    ty.set(
      withSequence(
        withTiming(0, { duration: IN }),
        withDelay(HOLD, withTiming(10, { duration: OUT })),
      ),
    );
    s.set(withTiming(1, { duration: IN }));
  }, [o, ty, s]);

  const anim = useAnimatedStyle(() => ({
    opacity: o.get(),
    transform: [{ translateY: ty.get() }, { scale: s.get() }],
  }));

  return (
    <Animated.View
      style={[
        styles.toast,
        { bottom: bottom + height + 12, maxWidth: Math.min(350, width - 40) },
        anim,
      ]}
      accessibilityLiveRegion="polite"
    >
      <Icon name={entry.icon} size={18} color={colors.brand} />
      <Text style={styles.text} color={colors.onChrome} numberOfLines={2}>
        {entry.message}
      </Text>
    </Animated.View>
  );
}

const useStyles = createStyles((t) => ({
  toast: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 90,
    pointerEvents: "none",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
    // aviso escuro nos dois temas (chrome); no escuro com o fio claro da sombra
    backgroundColor: t.colors.chrome,
    ...t.shadows.toast,
  },
  text: { fontFamily: fontFamily(600), fontSize: 14, lineHeight: 18, flexShrink: 1 },
}));
