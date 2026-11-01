import { Image, type ImageProps } from "expo-image";
import { memo, useState } from "react";
import { PixelRatio, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { imageVariantUrl, imageWidthFor } from "@/contracts/images";
import { createStyles } from "../theme/createStyles";
import { useColors } from "../theme/ThemeProvider";
import { Icon, type IconName } from "./Icon";

export type PhotoProps = Omit<ImageProps, "source" | "style"> & {
  /** URL absoluta (use mediaUrl() do core/api) ou null enquanto não há foto. */
  source: string | null | undefined;
  style?: StyleProp<ViewStyle>;
  /** Ícone no centro quando não há foto. */
  fallbackIcon?: IconName;
  /** Padrão: `textMuted` do tema. */
  fallbackIconColor?: string;
  /**
   * Largura exibida (pt). Com ela, baixa a miniatura WebP do ERP no tamanho certo
   * (160/480/960 px) em vez da original; se a miniatura não existir, cai na original.
   */
  displayWidth?: number;
};

/** Foto (.ph): expo-image com cache em memória+disco, fade de 200ms e fundo `surface`. */
export const Photo = memo(function Photo({
  source,
  style,
  fallbackIcon,
  fallbackIconColor,
  contentFit = "cover",
  transition = 200,
  cachePolicy = "memory-disk",
  recyclingKey,
  accessibilityLabel,
  displayWidth,
  onError,
  ...rest
}: PhotoProps) {
  const colors = useColors();
  const styles = useStyles();
  // Miniatura que falhou (ainda sem backfill no servidor): usa a original.
  const [failedVariant, setFailedVariant] = useState<string | null>(null);
  const variant =
    source && displayWidth
      ? imageVariantUrl(source, imageWidthFor(displayWidth, PixelRatio.get()))
      : source;
  const uri = variant && variant !== failedVariant ? variant : source;
  // a View carrega o tamanho/raio e o fundo card enquanto a imagem não chega
  return (
    <View
      style={[styles.base, !source && styles.center, style]}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? "image" : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      {uri ? (
        <Image
          {...rest}
          source={uri}
          recyclingKey={recyclingKey ?? uri}
          onError={(event) => {
            if (uri !== source) setFailedVariant(uri);
            onError?.(event);
          }}
          contentFit={contentFit}
          transition={transition}
          cachePolicy={cachePolicy}
          style={StyleSheet.absoluteFill}
        />
      ) : fallbackIcon ? (
        <Icon name={fallbackIcon} color={fallbackIconColor ?? colors.textMuted} />
      ) : null}
    </View>
  );
});

const useStyles = createStyles((t) => ({
  base: { backgroundColor: t.colors.surface, overflow: "hidden" },
  center: { alignItems: "center", justifyContent: "center" },
}));
