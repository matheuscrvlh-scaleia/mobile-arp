import { View } from "react-native";
import { createStyles, Icon, radii, Text, useColors } from "@/design";

/** Aviso de erro do formulário inteiro (credenciais, excesso de tentativas). */
export function FormAlert({ message }: { message: string }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.alert} accessibilityLiveRegion="polite">
      <Icon name="circle-alert" size={18} color={colors.dangerText} />
      <Text variant="small" tone="dangerText" style={styles.text}>
        {message}
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  alert: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: t.colors.dangerSoft,
    marginBottom: 4,
  },
  text: { flex: 1, lineHeight: 19 },
}));
