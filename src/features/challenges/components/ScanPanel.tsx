import { useState } from "react";
import { TextInput, View } from "react-native";
import type { ChallengeItem } from "@/contracts/app/challenges";
import { Button, createStyles, fontFamily, Icon, Text, tracking, useColors } from "@/design";
import { normalizeTypedCode } from "../lib/progress";
import { RetryCountdown } from "./RetryCountdown";

/** Leitura que falhou sem recusa (rede, servidor, limite): espera o toque em "Tentar de novo". */
export type ScanFailureNotice = {
  payload: string;
  message: string;
  /** 429: travado até este instante (ms). */
  until: number | null;
};

export type ScanPanelProps = {
  challenge: ChallengeItem | null;
  /** Campo "Digitar código" aberto. */
  typing: boolean;
  onToggleTyping: () => void;
  onSubmitCode: (payload: string) => void;
  busy: boolean;
  failure: ScanFailureNotice | null;
  onRetry: () => void;
  bottomPadding: number;
};

/** Painel do leitor (.scan-panel, `surfaceRaised`): instrução, desafio escolhido e o código digitado. */
export function ScanPanel({
  challenge,
  typing,
  onToggleTyping,
  onSubmitCode,
  busy,
  failure,
  onRetry,
  bottomPadding,
}: ScanPanelProps) {
  const colors = useColors();
  const styles = useStyles();
  const [code, setCode] = useState("");
  const payload = normalizeTypedCode(code);

  const submit = () => {
    if (!payload || busy) return;
    onSubmitCode(payload);
  };

  return (
    <View style={[styles.panel, { paddingBottom: bottomPadding }]}>
      <Text style={styles.h3} accessibilityRole="header">
        Aponte para o QR Code
      </Text>
      <Text variant="small" tone="textMuted" style={styles.p}>
        A loja ou a equipe da ARP mostra o código. O selo entra na hora na sua coleção.
      </Text>
      {challenge ? (
        <View style={styles.chip} accessible accessibilityLabel={`Desafio: ${challenge.title}`}>
          <View style={styles.chipIc}>
            <Icon name={challenge.icon} size={17} color={colors.text} />
          </View>
          <Text variant="smallStrong" numberOfLines={1} style={styles.chipText}>
            {challenge.title}
          </Text>
        </View>
      ) : null}
      {failure && !busy ? (
        <View style={styles.failure} accessibilityLiveRegion="polite">
          <Icon name="circle-alert" size={18} color={colors.dangerText} />
          <Text variant="small" tone="dangerText" style={styles.failureText}>
            {failure.until != null ? <RetryCountdown until={failure.until} /> : failure.message}
          </Text>
          <Button
            label="Tentar de novo"
            variant="dark"
            size="sm"
            onPress={onRetry}
            disabled={failure.until != null}
          />
        </View>
      ) : null}
      {typing ? (
        <View style={styles.codeRow}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Código do QR"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            autoFocus
            returnKeyType="send"
            onSubmitEditing={submit}
            editable={!busy}
            accessibilityLabel="Código do QR Code"
            style={styles.input}
          />
          <Button
            label="Validar"
            variant="brand"
            size="sm"
            onPress={submit}
            loading={busy}
            disabled={!payload}
            style={styles.send}
          />
        </View>
      ) : (
        <Button
          label="Digitar código"
          variant="soft"
          iconLeft="keyboard"
          onPress={onToggleTyping}
          accessibilityHint="Digite o código impresso abaixo do QR Code"
        />
      )}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  panel: {
    backgroundColor: t.colors.surfaceRaised,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 46,
    borderBottomRightRadius: 46,
    paddingTop: 22,
    paddingHorizontal: 20,
  },
  h3: {
    fontFamily: fontFamily(800),
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: tracking(21, -0.03),
    marginBottom: 4,
  },
  p: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: t.colors.surface,
    marginBottom: 14,
  },
  chipIc: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: t.colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { flex: 1 },
  failure: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 18,
    backgroundColor: t.colors.dangerSoft,
    marginBottom: 14,
  },
  failureText: { flex: 1 },
  codeRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: t.colors.surface,
    paddingHorizontal: 18,
    fontFamily: fontFamily(500),
    fontSize: 15,
    color: t.colors.text,
  },
  send: { alignSelf: "auto" },
}));
