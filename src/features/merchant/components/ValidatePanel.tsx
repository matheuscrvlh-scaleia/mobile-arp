import { useRouter } from "expo-router";
import { useState } from "react";
import { Keyboard, View } from "react-native";
import { Button, createStyles, Text, toast } from "@/design";
import { haptic } from "@/shared/lib/haptics";
import { useValidateCode } from "../hooks/useValidateCode";
import { fullCode, INCOMPLETE_CODE, isCompleteBody } from "../lib/code";
import { CodeField } from "./CodeField";
import { Panel } from "./Panel";

/** "Validar cupom" do painel (.validate): código digitado + botão, e o atalho para a câmera. */
export function ValidatePanel() {
  const styles = useStyles();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { check, checking } = useValidateCode();

  const submit = () => {
    if (checking) return;
    if (!body) {
      haptic.error();
      toast.show("Digite o código do cliente", "keyboard", { haptic: "none" });
      return;
    }
    if (!isCompleteBody(body)) {
      haptic.error();
      setError(INCOMPLETE_CODE);
      return;
    }
    Keyboard.dismiss();
    check(fullCode(body), { onRedeemed: () => setBody("") });
  };

  return (
    <Panel title="Validar cupom" subtitle="Digite o código que o cliente mostrar ou leia o QR.">
      <View style={styles.row}>
        <CodeField
          value={body}
          onChangeText={(next) => {
            setBody(next);
            if (error) setError(null);
          }}
          onSubmit={submit}
          invalid={!!error}
        />
        <Button
          label="Validar"
          size="sm"
          loading={checking}
          onPress={submit}
          style={styles.button}
        />
      </View>
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
      <Button
        label="Ler QR do cliente"
        variant="white"
        size="sm"
        iconLeft="scan-line"
        onPress={() => router.push("/lojista/validar")}
        style={styles.scan}
      />
    </Panel>
  );
}

const useStyles = createStyles(() => ({
  row: { flexDirection: "row", gap: 8, marginTop: 4 },
  // .validate .btn: 110 × 54, raio 18, fonte 14
  button: { width: 110, height: 54, borderRadius: 18, alignSelf: "auto" },
  error: { marginTop: 8, marginLeft: 4 },
  scan: { marginTop: 10 },
}));
