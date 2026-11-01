import { Pressable, StyleSheet } from "react-native";
import { hitSlop, Text } from "@/design";

export type TextLinkProps = {
  /** Parte em cinza antes do link (ex.: "Já tenho conta · "). */
  prefix?: string;
  label: string;
  onPress: () => void;
  align?: "center" | "right";
};

/** Link de texto (ex.: "Já tenho conta · Entrar"). */
export function TextLink({ prefix, label, onPress, align = "center" }: TextLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop.sm}
      accessibilityRole="link"
      accessibilityLabel={`${prefix ?? ""}${label}`}
      style={[styles.base, align === "right" ? styles.right : styles.center]}
    >
      <Text variant="body" tone="textMuted" align={align}>
        {prefix}
        <Text variant="bodyStrong" tone="text">
          {label}
        </Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 44, justifyContent: "center" },
  center: { alignSelf: "center" },
  right: { alignSelf: "flex-end" },
});
