import { Pressable, View } from "react-native";
import { createStyles, fontFamily, Text, withAlpha } from "@/design";
import { haptic } from "@/shared/lib/haptics";
import type { MapFloor } from "../lib/map-geometry";

/** Botões de andar como num elevador (.floors): o mais alto em cima. */
export function FloorPicker({
  floors,
  value,
  onChange,
}: {
  floors: readonly MapFloor[];
  value: string;
  onChange: (floorId: string) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {floors.map((f) => {
        const on = f.id === value;
        return (
          <Pressable
            key={f.id}
            onPress={() => {
              if (on) return;
              haptic.select();
              onChange(f.id);
            }}
            accessibilityRole="tab"
            accessibilityLabel={f.label}
            accessibilityState={{ selected: on }}
            style={[styles.btn, on && styles.on]}
          >
            <Text style={styles.label} tone={on ? "onInverse" : "textMuted"}>
              {f.shortLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrap: {
    backgroundColor: t.colors.surfaceRaised,
    borderRadius: 26,
    padding: 5,
    gap: 4,
    // no escuro: sombra mais forte + fio claro (a sombra preta some no fundo noturno)
    boxShadow: t.dark
      ? `0 16px 30px -14px ${withAlpha(t.colors.scrim, 0.8)}, inset 0 0 0 1px ${withAlpha(t.colors.onMedia, 0.07)}`
      : `0 16px 30px -14px ${withAlpha(t.colors.scrim, 0.35)}`,
  },
  btn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  on: { backgroundColor: t.colors.inverse },
  label: { fontFamily: fontFamily(800), fontSize: 16, lineHeight: 20 },
}));
