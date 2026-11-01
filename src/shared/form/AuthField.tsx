import { type Ref, useState } from "react";
import {
  Pressable,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  View,
} from "react-native";
import {
  createStyles,
  fontFamily,
  hitSlop,
  Icon,
  type IconName,
  Text,
  tracking,
  useColors,
} from "@/design";

export type AuthFieldProps = Omit<TextInputProps, "style" | "secureTextEntry" | "editable"> & {
  icon: IconName;
  label: string;
  error?: string;
  /** Texto de apoio abaixo do campo (some quando há erro). */
  hint?: string;
  /** Campo de senha: esconde o texto e mostra o botão de ver/ocultar. */
  password?: boolean;
  /** Só leitura (ex.: e-mail no "Seus dados"). */
  readOnly?: boolean;
  ref?: Ref<TextInputInstance>;
};

/** Campo do formulário (.field): ícone, rótulo pequeno em cima e o texto. */
export function AuthField({
  icon,
  label,
  error,
  hint,
  password = false,
  readOnly = false,
  ref,
  onFocus,
  onBlur,
  ...input
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.box,
          focused && styles.focused,
          !!error && styles.invalid,
          readOnly && styles.readOnly,
        ]}
      >
        <View style={styles.icon}>
          <Icon name={icon} size={20} color={colors.textMuted} />
        </View>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          ref={ref}
          {...input}
          editable={!readOnly}
          secureTextEntry={password && !visible}
          accessibilityLabel={input.accessibilityLabel ?? label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.brandText}
          cursorColor={colors.brandText}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, password && styles.inputWithToggle, readOnly && styles.inputRO]}
        />
        {password ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={hitSlop.md}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Ocultar senha" : "Mostrar senha"}
            style={styles.toggle}
          >
            <Icon name={visible ? "eye-off" : "eye"} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
        {readOnly ? (
          <View style={styles.toggle}>
            <Icon name="lock" size={16} color={colors.textMuted} />
          </View>
        ) : null}
      </View>
      {error ? (
        <Text
          variant="small"
          tone="dangerText"
          style={styles.note}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" tone="textMuted" style={styles.note}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrap: { marginBottom: 12 },
  box: {
    height: 62,
    borderRadius: 20,
    backgroundColor: t.colors.surface,
    // inset 0 0 0 2px no foco: a borda fica sempre lá (transparente) para não pular o layout
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
  },
  focused: { borderColor: t.colors.brand, backgroundColor: t.colors.surfaceRaised },
  invalid: { borderColor: t.colors.danger },
  readOnly: { backgroundColor: t.colors.surfaceSunken },
  icon: { position: "absolute", left: 14, top: 0, bottom: 0, justifyContent: "center" },
  label: {
    position: "absolute",
    left: 48,
    top: 8,
    fontFamily: fontFamily(650),
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: tracking(11, 0.02),
    color: t.colors.textMuted,
  },
  input: {
    height: "100%",
    paddingTop: 20,
    paddingBottom: 4,
    paddingLeft: 48,
    paddingRight: 14,
    fontFamily: fontFamily(550),
    fontSize: 16,
    color: t.colors.text,
  },
  inputWithToggle: { paddingRight: 52 },
  inputRO: { color: t.colors.textSecondary, paddingRight: 44 },
  toggle: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  note: { marginTop: 6, marginLeft: 16 },
}));
