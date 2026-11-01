import { View } from "react-native";
import type { MerchantStore } from "@/contracts/app/merchant";
import {
  createStyles,
  fontFamily,
  IconButton,
  layout,
  Text,
  tracking,
  useTopInset,
} from "@/design";
import { goBackOr } from "@/navigation/navigate";
import { StoreMono } from "./StoreMono";

export type MerchantHeaderProps = {
  store: Pick<MerchantStore, "name" | "icon" | "brandColor">;
  onMenu: () => void;
};

/** Cabeçalho do painel (.mh): voltar, ícone da loja na cor da marca, nome e o menu. */
export function MerchantHeader({ store, onMenu }: MerchantHeaderProps) {
  const styles = useStyles();
  const paddingTop = useTopInset("header");
  return (
    <View style={[styles.row, { paddingTop }]}>
      <IconButton
        icon="chevron-left"
        accessibilityLabel="Voltar"
        onPress={() => goBackOr("/perfil")}
      />
      <StoreMono store={store} />
      <View style={styles.text} accessible accessibilityRole="header">
        <Text style={styles.name} numberOfLines={1}>
          {store.name}
        </Text>
        <Text variant="small" tone="textMuted" numberOfLines={1}>
          Painel do lojista
        </Text>
      </View>
      <IconButton
        icon="settings"
        variant="dark"
        accessibilityLabel="Opções do lojista"
        onPress={onMenu}
      />
    </View>
  );
}

const useStyles = createStyles(() => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: layout.gutter,
  },
  text: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: fontFamily(700),
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: tracking(18, -0.02),
  },
}));
