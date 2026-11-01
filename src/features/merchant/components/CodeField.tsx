import { type Ref, useState } from "react";
import { Platform, TextInput, type TextInputInstance, View } from "react-native";
import { createStyles, fontFamily, Text, tracking, useColors } from "@/design";
import { CODE_BODY_LENGTH, CODE_PREFIX, codeBody } from "../lib/code";

export type CodeFieldProps = {
  /** Só o corpo do código (sem o "ARP-", que fica fixo no campo). */
  value: string;
  onChangeText: (body: string) => void;
  onSubmit: () => void;
  invalid?: boolean;
  /** Sobre fundo elevado (painel da câmera): o campo usa `surface` em vez de `surfaceRaised`. */
  onRaised?: boolean;
  editable?: boolean;
  ref?: Ref<TextInputInstance>;
};

/**
 * Campo do código do cupom (.validate input): "ARP-" fixo e os 6 caracteres em maiúsculas.
 * Aceita colar o código inteiro (com ou sem hífen): o corpo é extraído em `codeBody`.
 */
export function CodeField({
  value,
  onChangeText,
  onSubmit,
  invalid = false,
  onRaised = false,
  editable = true,
  ref,
}: CodeFieldProps) {
  const colors = useColors();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.box,
        onRaised && styles.boxOnRaised,
        focused && styles.focused,
        invalid && styles.invalid,
      ]}
    >
      <Text style={styles.prefix} tone="textMuted" importantForAccessibility="no">
        {CODE_PREFIX}
      </Text>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(text) => onChangeText(codeBody(text))}
        onSubmitEditing={onSubmit}
        editable={editable}
        placeholder={"X".repeat(CODE_BODY_LENGTH)}
        placeholderTextColor={colors.textSubtle}
        selectionColor={colors.brandText}
        cursorColor={colors.brandText}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        // Android: teclado sem sugestões (o código não é palavra)
        keyboardType={Platform.OS === "android" ? "visible-password" : "default"}
        returnKeyType="go"
        submitBehavior="blurAndSubmit"
        accessibilityLabel="Código do cupom"
        accessibilityHint="Digite as 6 letras ou números depois de ARP-"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.input}
      />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  box: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    backgroundColor: t.colors.surfaceRaised,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    // inset 0 0 0 2px no foco: a borda fica sempre lá (transparente) para não pular o layout
    borderWidth: 2,
    borderColor: "transparent",
  },
  boxOnRaised: { backgroundColor: t.colors.surface },
  focused: { borderColor: t.colors.brand },
  invalid: { borderColor: t.colors.danger },
  prefix: {
    fontFamily: fontFamily(700),
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: tracking(17, 0.1),
  },
  input: {
    flex: 1,
    height: "100%",
    paddingRight: 12,
    fontFamily: fontFamily(700),
    fontSize: 17,
    letterSpacing: tracking(17, 0.1),
    color: t.colors.text,
  },
}));
