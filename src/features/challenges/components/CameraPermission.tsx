import { Linking, View } from "react-native";
import { Button, createStyles, Icon, Text, useColors, withAlpha } from "@/design";

export type CameraPermissionProps = {
  /** false = o sistema não deixa mais perguntar: só pelos ajustes. */
  canAsk: boolean;
  onRequest: () => void;
  onTypeCode: () => void;
};

/** Pedido de câmera do leitor (antes do primeiro uso ou quando foi negada). Fica sobre o fundo
    preto da câmera (`scrim`) nos dois temas: texto `onMedia`. */
export function CameraPermission({ canAsk, onRequest, onTypeCode }: CameraPermissionProps) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <View style={styles.tile}>
        <Icon name="camera" size={34} color={colors.onBrand} />
        <View style={styles.badge}>
          <Icon name="qr-code" size={16} color={colors.onChrome} />
        </View>
      </View>
      <Text variant="h1" tone="onMedia" align="center" accessibilityRole="header">
        {canAsk ? "Use a câmera para ler o QR Code" : "A câmera está bloqueada"}
      </Text>
      <Text
        variant="body"
        color={withAlpha(colors.onMedia, 0.55)}
        align="center"
        style={styles.text}
      >
        {canAsk
          ? "A ARP só usa a câmera para ler o QR Code dos desafios e colocar o selo na sua coleção. Nada é gravado."
          : "Para ler o QR Code dos desafios, libere a câmera para a ARP nos ajustes do celular."}
      </Text>
      <View style={styles.actions}>
        {canAsk ? (
          <Button label="Permitir câmera" variant="brand" iconLeft="camera" onPress={onRequest} />
        ) : (
          <Button
            label="Abrir ajustes"
            variant="brand"
            iconLeft="settings"
            onPress={() => void Linking.openSettings()}
          />
        )}
        <Button
          label="Digitar código"
          variant="lineLight"
          iconLeft="keyboard"
          onPress={onTypeCode}
        />
      </View>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  wrap: { flex: 1, justifyContent: "center", paddingHorizontal: 28, gap: 10 },
  tile: {
    alignSelf: "center",
    width: 88,
    height: 88,
    borderRadius: 30,
    backgroundColor: t.colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  badge: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: t.colors.chrome,
    borderWidth: 3,
    borderColor: t.colors.chrome,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { lineHeight: 22 },
  actions: { gap: 10, marginTop: 18 },
}));
