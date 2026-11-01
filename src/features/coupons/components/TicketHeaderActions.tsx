import { StyleSheet, View } from "react-native";
import { IconButton } from "@/design";

type TicketHeaderActionsProps = {
  onShare: () => void;
  onSave: () => void;
};

/** Ações do cabeçalho do "meu cupom" ativo: compartilhar e salvar na galeria. */
export function TicketHeaderActions({ onShare, onSave }: TicketHeaderActionsProps) {
  return (
    <View style={styles.row}>
      <IconButton
        icon="share-2"
        variant="white"
        onPress={onShare}
        accessibilityLabel="Compartilhar cupom"
      />
      <IconButton
        icon="download"
        variant="white"
        onPress={onSave}
        accessibilityLabel="Salvar cupom na galeria"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
});
