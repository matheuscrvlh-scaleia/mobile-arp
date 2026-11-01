import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withAlpha } from "../theme/color";
import { useColors } from "../theme/ThemeProvider";
import { layout } from "../tokens";

const PAD_TOP = 18;
const BUTTON = 58;
/** padding-bottom do .cta-bar (34) vira max(safe area, 20) no aparelho */
const MIN_BOTTOM = 20;

/** Altura total da CtaBar, para o conteúdo rolável não ficar escondido atrás dela. */
export function useCtaBarHeight(): number {
  const { bottom } = useSafeAreaInsets();
  return PAD_TOP + BUTTON + Math.max(bottom, MIN_BOTTOM);
}

export type CtaBarProps = {
  /** Botões lado a lado (gap 10). IconButton aqui usa size={58}. */
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Barra fixa no rodapé (.cta-bar), com o fundo da página (`bg`) subindo em degradê sobre o
    conteúdo. */
export function CtaBar({ children, style }: CtaBarProps) {
  const { bottom } = useSafeAreaInsets();
  const { bg } = useColors();
  return (
    <LinearGradient
      // linear-gradient(to top, <bg> 70%, transparent): o transparente é o próprio bg com alfa 0
      colors={[withAlpha(bg, 0), bg, bg]}
      locations={[0, 0.3, 1]}
      style={[styles.bar, { paddingBottom: Math.max(bottom, MIN_BOTTOM) }, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    pointerEvents: "box-none",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: PAD_TOP,
    paddingHorizontal: layout.gutter,
  },
});
