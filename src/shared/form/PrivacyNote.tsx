import { View } from "react-native";
import { createStyles, Icon, radii, Text, useColors } from "@/design";

/** Aviso verde de privacidade (.privacy). */
export function PrivacyNote({ children }: { children: string }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.box}>
      <Icon name="shield-check" size={18} color={colors.brandText} style={styles.icon} />
      <Text variant="small" tone="brandText" style={styles.text}>
        {children}
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  box: {
    marginTop: 18,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: t.colors.brand50,
    flexDirection: "row",
    gap: 10,
  },
  icon: { marginTop: 1 },
  text: { flex: 1, lineHeight: 19 },
}));
