import { type Ref, useState } from "react";
import { Platform, TextInput, type TextInputInstance, View } from "react-native";
import { createStyles, fontFamily, Text } from "@/design";
import { cleanResetCode, RESET_CODE_LENGTH } from "../lib/reset-code";

export type CodeInputProps = {
  value: string;
  onChange: (code: string) => void;
  /** Chamado quando os 6 dígitos estão preenchidos (digitado, colado ou sugerido pelo teclado). */
  onComplete?: (code: string) => void;
  onBlur?: () => void;
  error?: string;
  ref?: Ref<TextInputInstance>;
};

const SLOTS = Array.from({ length: RESET_CODE_LENGTH }, (_, i) => i);

/**
 * Código de 6 dígitos em 6 caixas. Um campo só, invisível, por cima das caixas:
 * colar o código inteiro, a sugestão do teclado (iOS lê o código do Mail;
 * Android, do SMS/autofill) e apagar funcionam como num campo comum.
 */
export function CodeInput({ value, onChange, onComplete, onBlur, error, ref }: CodeInputProps) {
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, RESET_CODE_LENGTH - 1);

  return (
    <View style={styles.wrap}>
      <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no">
        {SLOTS.map((i) => (
          <View
            key={i}
            style={[
              styles.box,
              focused && i === active && styles.boxActive,
              !!error && styles.boxInvalid,
            ]}
          >
            <Text style={styles.digit}>{value[i] ?? ""}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(text) => {
          const code = cleanResetCode(text);
          onChange(code);
          if (code.length === RESET_CODE_LENGTH && code !== value) onComplete?.(code);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
        // folga para o texto colado com espaço/hífen ("123 456"): o limpo fica com 6
        maxLength={RESET_CODE_LENGTH * 3}
        caretHidden
        contextMenuHidden={false}
        accessibilityLabel="Código de 6 dígitos"
        accessibilityValue={{ text: value.split("").join(" ") }}
        accessibilityHint={error}
        style={styles.input}
      />
      {error ? (
        <Text
          variant="small"
          tone="dangerText"
          style={styles.error}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrap: { marginBottom: 16 },
  row: { flexDirection: "row", gap: 8 },
  box: {
    flex: 1,
    height: 62,
    borderRadius: 18,
    backgroundColor: t.colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  boxActive: { borderColor: t.colors.brand, backgroundColor: t.colors.surfaceRaised },
  boxInvalid: { borderColor: t.colors.danger },
  digit: { fontFamily: fontFamily(750), fontSize: 24, lineHeight: 30, color: t.colors.text },
  // por cima das caixas, sem desenhar nada (o toque abre o teclado; o texto aparece nas caixas)
  input: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 62,
    color: "transparent",
    backgroundColor: "transparent",
    fontSize: 16,
    // quase invisível mas ainda tocável (com opacity 0 o iOS ignora o toque)
    opacity: 0.02,
  },
  error: { marginTop: 6, marginLeft: 16 },
}));
