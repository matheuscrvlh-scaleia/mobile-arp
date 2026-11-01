import { StyleSheet, View } from "react-native";
import { Icon, Text, useColors } from "@/design";

/** Requisitos da senha (os mesmos do servidor), marcados conforme o visitante digita. */
export function PasswordHint({ value }: { value: string }) {
  const colors = useColors();
  const rules = [
    { label: "8 caracteres ou mais", ok: value.length >= 8 },
    { label: "uma letra", ok: /[A-Za-z]/.test(value) },
    { label: "um número", ok: /\d/.test(value) },
  ];
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel="A senha precisa de 8 caracteres ou mais, com letra e número"
    >
      {rules.map((rule) => (
        <View key={rule.label} style={styles.item}>
          <Icon
            name={rule.ok ? "circle-check" : "circle"}
            size={14}
            color={rule.ok ? colors.brandText : colors.textMuted}
          />
          <Text variant="caption" tone={rule.ok ? "brandText" : "textMuted"}>
            {rule.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: -4,
    marginBottom: 12,
    marginLeft: 16,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 4 },
});
