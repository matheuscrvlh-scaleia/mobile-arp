import type { ReactNode } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { createStyles, layout, Text } from "@/design";

export type PanelProps = {
  title: string;
  /** Lado direito do título (ex.: pílula "pico às 19h"). */
  right?: ReactNode;
  /** Linha de apoio (.p-sub). */
  subtitle?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Bloco do painel do lojista (.panel): fundo surface, raio 28, título e texto de apoio. */
export function Panel({ title, right, subtitle, children, style }: PanelProps) {
  const styles = useStyles();
  return (
    <View style={[styles.panel, style]}>
      <View style={styles.head}>
        <Text variant="h4" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {right}
      </View>
      {subtitle ? (
        <Text variant="small" tone="textMuted" style={styles.sub}>
          {subtitle}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  panel: {
    marginTop: 12,
    marginHorizontal: layout.gutter,
    padding: 18,
    borderRadius: 28,
    backgroundColor: t.colors.surface,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 4,
  },
  title: { flexShrink: 1 },
  sub: { marginBottom: 14 },
}));
