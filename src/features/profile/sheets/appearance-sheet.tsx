import { Pressable, View } from "react-native";
import {
  Button,
  createStyles,
  Icon,
  SheetActions,
  SheetIcon,
  SheetText,
  SheetTitle,
  sheet,
  Text,
  type ThemePreference,
  useColors,
  useThemePreference,
} from "@/design";
import { haptic } from "@/shared/lib/haptics";

/** Rótulo curto da escolha atual (lado direito do item "Aparência" no perfil). */
export const THEME_PREFERENCE_LABEL: Record<ThemePreference, string> = {
  system: "Automático",
  light: "Claro",
  dark: "Escuro",
};

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Automático (do aparelho)" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
];

/** Painel de aparência: segue o aparelho, claro ou escuro. A troca vale na hora. */
export function openAppearanceSheet(): void {
  sheet.open(({ close }) => <AppearanceSheet onDone={close} />);
}

function AppearanceSheet({ onDone }: { onDone: () => void }) {
  const [preference, setPreference] = useThemePreference();
  const colors = useColors();
  const styles = useStyles();

  const choose = (value: ThemePreference) => {
    if (value === preference) return;
    haptic.select();
    setPreference(value);
  };

  return (
    <>
      <SheetIcon name="moon" background="surface" />
      <SheetTitle>Aparência</SheetTitle>
      <SheetText>Use o tema claro ou o escuro, ou deixe o app acompanhar o aparelho.</SheetText>
      <View style={styles.group} accessibilityRole="radiogroup" accessibilityLabel="Aparência">
        {OPTIONS.map((option, index) => {
          const selected = option.value === preference;
          return (
            <Pressable
              key={option.value}
              onPress={() => choose(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={option.label}
              style={({ pressed }) => [
                styles.row,
                index < OPTIONS.length - 1 && styles.divider,
                pressed && styles.pressed,
              ]}
            >
              <Text variant="body" weight={selected ? 650 : 550} style={styles.label}>
                {option.label}
              </Text>
              <View style={[styles.radio, selected && styles.radioOn]}>
                {selected ? (
                  <Icon name="check" size={14} color={colors.onInverse} strokeWidth={3} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <SheetActions>
        <Button label="Pronto" variant="soft" onPress={onDone} />
      </SheetActions>
    </>
  );
}

const useStyles = createStyles((t) => ({
  group: {
    backgroundColor: t.colors.surface,
    borderRadius: 22,
    paddingVertical: 2,
    marginBottom: 20,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  pressed: { backgroundColor: t.colors.surfaceStrong },
  label: { flex: 1 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: t.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { backgroundColor: t.colors.inverse, borderColor: t.colors.inverse },
}));
