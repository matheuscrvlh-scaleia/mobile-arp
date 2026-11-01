import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import type { Highlight } from "@/contracts/app/home";
import { mediaUrl } from "@/core/api/media";
import {
  createStyles,
  cssAngle,
  fontFamily,
  Icon,
  Photo,
  Pill,
  PressableScale,
  RadialGlow,
  radii,
  Text,
  Trevo,
  tracking,
  useColors,
  useTheme,
  withAlpha,
} from "@/design";

export const SLIDE_HEIGHT = 190;

type Props = {
  highlight: Highlight;
  width: number;
  onPress: (highlight: Highlight) => void;
};

/** linear-gradient(100deg, rgba(10,18,11,.82) 0, .35 60%, .05) do .slide::after (véu `scrim`) */
const SHADE = {
  alphas: [0.82, 0.35, 0.05] as const,
  locations: [0, 0.6, 1] as const,
  ...cssAngle(100),
};

/** Um destaque do carrossel (.slide). Sem imagem vira o .slide.promo verde. */
export function HighlightSlide({ highlight, width, onPress }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const image = mediaUrl(highlight.imageUrl);
  const promo = !image;
  // promo: verde da marca (igual nos dois temas) → onBrand; foto → onMedia
  const fg = promo ? colors.onBrand : colors.onMedia;
  const ctaFg = promo ? colors.onInverse : colors.text;
  const cta = highlight.ctaLabel ?? (highlight.targetType === "none" ? null : "Ver mais");

  return (
    <PressableScale
      scaleTo={0.98}
      onPress={() => onPress(highlight)}
      accessibilityRole={highlight.targetType === "none" ? "summary" : "button"}
      accessibilityLabel={[highlight.title, highlight.subtitle, cta].filter(Boolean).join(". ")}
      style={[styles.slide, { width }]}
    >
      {image ? (
        <>
          <Photo
            source={image}
            displayWidth={width}
            recyclingKey={`hl-${highlight.id}`}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[
              withAlpha(colors.scrim, SHADE.alphas[0]),
              withAlpha(colors.scrim, SHADE.alphas[1]),
              withAlpha(colors.scrim, SHADE.alphas[2]),
            ]}
            locations={SHADE.locations}
            start={SHADE.start}
            end={SHADE.end}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : (
        <PromoBackground />
      )}

      {highlight.badge === "sponsored" ? (
        <Pill label="Patrocinado" variant="dark" style={[styles.ad, !promo && styles.adPhoto]} />
      ) : (
        <Pill
          label="Destaque"
          icon="sparkles"
          variant="glass"
          style={[styles.ad, !promo && styles.adPhoto]}
        />
      )}

      <View style={styles.inner}>
        <View>
          <Text style={styles.title} color={fg} numberOfLines={2}>
            {highlight.title}
          </Text>
          {highlight.subtitle ? (
            <Text style={styles.subtitle} color={fg} numberOfLines={2}>
              {highlight.subtitle}
            </Text>
          ) : null}
        </View>
        {cta ? (
          <View style={[styles.cta, promo && styles.ctaPromo]}>
            <Text style={styles.ctaText} color={ctaFg}>
              {cta}
            </Text>
            <Icon name="arrow-right" size={15} color={ctaFg} />
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

/**
 * radial-gradient(circle at 85% 20%, #8be09a 0, transparent 45%) + brand 135deg.
 * O "transparent 45%" do CSS é da distância ao canto mais longe; em fração do maior
 * lado do slide (~350×190) dá ~0,43.
 */
function PromoBackground() {
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  return (
    <>
      <LinearGradient
        colors={gradients.brand.colors}
        start={gradients.brand.start}
        end={gradients.brand.end}
        style={StyleSheet.absoluteFill}
      />
      <RadialGlow color={colors.brand300} center={PROMO_GLOW_CENTER} radius={0.43} />
      {/* No protótipo o promo tem o preço grande à direita; a API não traz preço: fica o trevo. */}
      <Trevo size={150} color={colors.onBrand} opacity={0.12} style={styles.watermark} />
    </>
  );
}

const PROMO_GLOW_CENTER = { x: 0.85, y: 0.2 };

const useStyles = createStyles((t) => ({
  slide: {
    height: SLIDE_HEIGHT,
    borderRadius: radii.card,
    overflow: "hidden",
    // fundo enquanto a foto carrega (escuro nos dois temas)
    backgroundColor: t.colors.chrome,
  },
  inner: {
    ...StyleSheet.absoluteFill,
    padding: 20,
    justifyContent: "space-between",
  },
  title: {
    fontFamily: fontFamily(800),
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: tracking(26, -0.035),
    maxWidth: 230,
  },
  subtitle: { fontSize: 13, lineHeight: 17, marginTop: 6, opacity: 0.85, maxWidth: 220 },
  cta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    // sobre a foto: pílula "white" (surfaceRaised); no promo verde: botão escuro (inverse)
    backgroundColor: t.colors.surfaceRaised,
  },
  ctaPromo: { backgroundColor: t.colors.inverse },
  ctaText: { fontFamily: fontFamily(700), fontSize: 13, lineHeight: 17 },
  // .slide .ad (promo: no alto); .slide:not(.promo) .ad: embaixo, alinhada ao CTA
  ad: { position: "absolute", top: 16, right: 16, zIndex: 2 },
  adPhoto: { top: undefined, bottom: 20 },
  watermark: { position: "absolute", right: -22, bottom: -34 },
}));
