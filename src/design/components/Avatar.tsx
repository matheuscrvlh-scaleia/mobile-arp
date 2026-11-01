import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useState } from "react";
import { PixelRatio, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { imageVariantUrl, imageWidthFor } from "@/contracts/images";
import { createStyles } from "../theme/createStyles";
import type { Palette } from "../theme/palettes";
import { useTheme } from "../theme/ThemeProvider";
import { Icon } from "./Icon";
import { Text } from "./Text";

export type AvatarProps = {
  /** URL da foto. Sem foto e sem iniciais → visitante (ícone de usuário). */
  source?: string | null;
  initials?: string | null;
  /** .avatar = 52; .pf-head .avatar = 92 */
  size?: number;
  /** Força o estilo visitante (.avatar.guest). */
  guest?: boolean;
  /** Anel em volta: `soft` (3px do fundo + brand-100, padrão) ou `brand` (perfil: 4px + brand). */
  ring?: "soft" | "brand" | "none";
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/* O anel interno tem a cor do fundo da página (separa a foto do anel colorido). No escuro o
   brand-100 é um tint apagado: o anel "soft" usa brand-700 para continuar visível. */
function ringShadow(c: Palette, dark: boolean, ring: "soft" | "brand", s: number): string {
  const outer = ring === "brand" ? c.brand : dark ? c.brand700 : c.brand100;
  return `0 0 0 ${s >= 80 ? 4 : 3}px ${c.bg}, 0 0 0 ${s >= 80 ? 6 : 4.5}px ${outer}`;
}

export const Avatar = memo(function Avatar({
  source,
  initials,
  size = 52,
  guest,
  ring = "soft",
  style,
  accessibilityLabel,
}: AvatarProps) {
  const { colors, dark, gradients } = useTheme();
  const styles = useStyles();
  // Miniatura do ERP no tamanho do avatar; se ainda não existir no servidor, a original.
  const [variantFailed, setVariantFailed] = useState(false);
  const variant = source ? imageVariantUrl(source, imageWidthFor(size, PixelRatio.get())) : null;
  const uri = variant && !variantFailed ? variant : source;
  const isGuest = guest ?? (!source && !initials);
  const round = { width: size, height: size, borderRadius: size / 2 };

  if (isGuest) {
    return (
      <View
        style={[styles.center, round, styles.guest, style]}
        accessible
        accessibilityLabel={accessibilityLabel ?? "Visitante"}
      >
        <Icon name="user" size={Math.round(size * 0.4)} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <View
      style={[round, ring !== "none" && { boxShadow: ringShadow(colors, dark, ring, size) }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? "Foto do perfil"}
    >
      <LinearGradient
        colors={gradients.brand.colors}
        start={gradients.brand.start}
        end={gradients.brand.end}
        style={[styles.center, round, styles.clip]}
      >
        {uri ? (
          <Image
            source={uri}
            recyclingKey={uri}
            onError={() => {
              if (uri !== source) setVariantFailed(true);
            }}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <Text
            color={colors.onMedia}
            weight={750}
            // lineHeight acompanha a fonte (o body tem 21: cortaria as iniciais no avatar grande)
            style={{ fontSize: Math.round(size * 0.33), lineHeight: Math.round(size * 0.4) }}
          >
            {initials}
          </Text>
        )}
      </LinearGradient>
    </View>
  );
});

const useStyles = createStyles((t) => ({
  center: { alignItems: "center", justifyContent: "center" },
  guest: { backgroundColor: t.colors.surface },
  clip: { overflow: "hidden" },
}));
