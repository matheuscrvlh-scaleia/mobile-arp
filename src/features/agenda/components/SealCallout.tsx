import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { createStyles, cssAngle, Icon, motion, PressableScale, Text, useColors } from "@/design";

const ICON_GRADIENT = cssAngle(145);

/** "Participar vale selo" (.ch-callout) → aba de desafios. */
export function SealCallout({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <PressableScale
      scaleTo={motion.pressScale.card}
      onPress={onPress}
      accessibilityLabel="Participar vale selo. Leia o QR Code na entrada do evento"
      accessibilityHint="Abre seus selos e desafios"
      style={styles.callout}
    >
      <LinearGradient
        colors={[colors.brand, colors.brand700]}
        start={ICON_GRADIENT.start}
        end={ICON_GRADIENT.end}
        style={styles.ic}
      >
        <Icon name="award" color={colors.onMedia} />
      </LinearGradient>
      <View style={styles.texts}>
        <Text variant="bodyStrong">Participar vale selo</Text>
        <Text variant="small" tone="brandText">
          Leia o QR Code na entrada do evento
        </Text>
      </View>
    </PressableScale>
  );
}

const useStyles = createStyles((t) => ({
  callout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 18,
    padding: 16,
    borderRadius: 22,
    backgroundColor: t.colors.brand50,
    borderWidth: 1.5,
    borderColor: t.colors.brand100,
  },
  ic: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  texts: { flex: 1, minWidth: 0 },
}));
