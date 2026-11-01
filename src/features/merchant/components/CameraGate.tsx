import { Linking, View } from "react-native";
import { Button, createStyles, Icon, Text, useColors, withAlpha } from "@/design";

export type CameraGateProps = {
  /** false = o sistema não deixa mais perguntar: só pelos ajustes. */
  canAsk: boolean;
  onRequest: () => void;
};

/** Pedido de câmera do leitor do caixa (sobre o fundo preto da câmera: texto `onMedia`). */
export function CameraGate({ canAsk, onRequest }: CameraGateProps) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <View style={styles.tile}>
        <Icon name="scan-line" size={34} color={colors.onBrand} />
      </View>
      <Text variant="h1" tone="onMedia" align="center" accessibilityRole="header">
        {canAsk ? "Leia o QR do cliente com a câmera" : "A câmera está bloqueada"}
      </Text>
      <Text
        variant="body"
        color={withAlpha(colors.onMedia, 0.6)}
        align="center"
        style={styles.text}
      >
        {canAsk
          ? "A câmera só lê o QR Code do ticket para conferir o cupom. Nada é gravado. Se preferir, digite o código abaixo."
          : "Libere a câmera para a ARP nos ajustes do celular, ou digite o código do cliente abaixo."}
      </Text>
      <View style={styles.actions}>
        {canAsk ? (
          <Button label="Permitir câmera" variant="brand" iconLeft="camera" onPress={onRequest} />
        ) : (
          <Button
            label="Abrir ajustes"
            variant="brand"
            iconLeft="settings"
            onPress={() => void Linking.openSettings().catch(() => undefined)}
          />
        )}
      </View>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrap: { flex: 1, justifyContent: "center", paddingHorizontal: 28, gap: 10 },
  tile: {
    alignSelf: "center",
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: t.colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  text: { lineHeight: 22 },
  actions: { marginTop: 14 },
}));
