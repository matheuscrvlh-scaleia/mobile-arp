import { View } from "react-native";
import type { MerchantStore } from "@/contracts/app/merchant";
import { contrastRatio, Icon, useColors } from "@/design";

/** Ícone da loja num quadrado da cor da marca (.mh .mono): 50 × 50, raio 17. */
export function StoreMono({
  store,
  size = 50,
}: {
  store: Pick<MerchantStore, "icon" | "brandColor">;
  size?: number;
}) {
  const colors = useColors();
  // Cor da API: marca clara (amarelo, areia) pede ícone escuro.
  const fg = contrastRatio(colors.onMedia, store.brandColor) >= 3 ? colors.onMedia : colors.onBrand;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size / 2.95),
        backgroundColor: store.brandColor,
        alignItems: "center",
        justifyContent: "center",
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Icon name={store.icon} size={Math.round(size * 0.46)} color={fg} />
    </View>
  );
}
