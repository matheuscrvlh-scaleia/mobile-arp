import { StyleSheet, View } from "react-native";
import { createStyles, Spinner, useColors, withAlpha } from "@/design";

const RADIUS = 34;
const CORNER = 50;
const BORDER = 5;
/** box-shadow: 0 0 0 999px rgba(0,0,0,.5): borda enorme em volta do furo arredondado. */
const DIM = 999;

/** Visor do leitor do caixa (.vf): escurece em volta e marca os cantos. Verde enquanto confere. */
export function ScanFrame({ size, busy }: { size: number; busy: boolean }) {
  const colors = useColors();
  const styles = useStyles();
  // sobre a imagem da câmera: branco nos dois temas
  const corner = { borderColor: busy ? colors.brand : colors.onMedia };
  return (
    <View
      style={{ width: size, height: size }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          styles.dim,
          {
            left: -DIM,
            top: -DIM,
            width: size + DIM * 2,
            height: size + DIM * 2,
            borderRadius: RADIUS + DIM,
          },
        ]}
      />
      <View style={[styles.cn, styles.tl, corner]} />
      <View style={[styles.cn, styles.tr, corner]} />
      <View style={[styles.cn, styles.bl, corner]} />
      <View style={[styles.cn, styles.br, corner]} />
      {busy ? (
        <View style={styles.center}>
          <View style={styles.busy}>
            <Spinner size={30} color={colors.onBrand} accessibilityLabel="Conferindo o código" />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  dim: { position: "absolute", borderWidth: DIM, borderColor: withAlpha(t.colors.scrim, 0.5) },
  cn: { position: "absolute", width: CORNER, height: CORNER, borderWidth: 0 },
  tl: {
    top: -3,
    left: -3,
    borderTopWidth: BORDER,
    borderLeftWidth: BORDER,
    borderTopLeftRadius: RADIUS,
  },
  tr: {
    top: -3,
    right: -3,
    borderTopWidth: BORDER,
    borderRightWidth: BORDER,
    borderTopRightRadius: RADIUS,
  },
  bl: {
    bottom: -3,
    left: -3,
    borderBottomWidth: BORDER,
    borderLeftWidth: BORDER,
    borderBottomLeftRadius: RADIUS,
  },
  br: {
    bottom: -3,
    right: -3,
    borderBottomWidth: BORDER,
    borderRightWidth: BORDER,
    borderBottomRightRadius: RADIUS,
  },
  center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  busy: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: t.colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
}));
