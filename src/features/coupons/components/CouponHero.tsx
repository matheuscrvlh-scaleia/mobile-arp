import { useEffect, useState } from "react";
import { Image, PixelRatio, Share, useWindowDimensions, View } from "react-native";
import Svg, { Defs, LinearGradient, Mask, Rect, Stop, Image as SvgImage } from "react-native-svg";
import type { CouponCard } from "@/contracts/app/coupons";
import { imageVariantUrl, imageWidthFor } from "@/contracts/images";
import { mediaUrl } from "@/core/api/media";
import {
  createStyles,
  fontFamily,
  Icon,
  IconButton,
  layout,
  Text,
  ToneSurface,
  tracking,
  useSvgId,
  useTheme,
  useTopInset,
  withAlpha,
} from "@/design";
import { goBackOr } from "@/navigation/navigate";

/** Branco da máscara (luminância = opacidade da foto). Não é cor visível: igual nos dois temas. */
const MASK_ON = "#ffffff";

/** Largura da foto, em % da largura do hero (= da tela). */
const PHOTO_PCT = 72;

type CouponHeroProps = {
  coupon: CouponCard;
  /** "Bloco 81", quando a loja já carregou. */
  block?: string | null;
};

/** Topo do detalhe (.cd-hero): tom do cupom, foto entrando pela direita e o número grande. */
export function CouponHero({ coupon, block }: CouponHeroProps) {
  const styles = useStyles();
  const { dark, toneOf } = useTheme();
  const { width } = useWindowDimensions();
  const tone = toneOf(coupon.tone);
  // texto claro sobre o tom: todos, menos o sand do tema claro (no escuro o sand é areia escura)
  const light = dark || coupon.tone !== "sand";
  const paddingTop = useTopInset("header");
  const photo = useVariantHref(mediaUrl(coupon.imageUrl), (width * PHOTO_PCT) / 100);
  const ids = useSvgId("hero");

  const back = () => goBackOr("/cupons");

  const share = () => {
    void Share.share({
      message: `${coupon.title} · ${coupon.store.name} na ARP\narp://cupom/${coupon.id}`,
    }).catch(() => undefined);
  };

  return (
    <ToneSurface tone={coupon.tone} style={[styles.hero, { paddingTop }]}>
      {photo ? (
        // mask-image: linear-gradient(90deg, transparent, .55 40%, #000 75%)
        <Svg style={styles.photo} accessibilityElementsHidden importantForAccessibility="no">
          <Defs>
            <LinearGradient id={`f${ids}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={MASK_ON} stopOpacity={0} />
              <Stop offset="0.4" stopColor={MASK_ON} stopOpacity={0.55} />
              <Stop offset="0.75" stopColor={MASK_ON} stopOpacity={1} />
            </LinearGradient>
            <Mask id={`m${ids}`}>
              <Rect width="100%" height="100%" fill={`url(#f${ids})`} />
            </Mask>
          </Defs>
          <SvgImage
            href={photo}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            mask={`url(#m${ids})`}
          />
        </Svg>
      ) : (
        <View style={styles.bigIcon} accessibilityElementsHidden importantForAccessibility="no">
          <Icon name={coupon.icon} size={180} color={tone.fg} strokeWidth={1.4} />
        </View>
      )}

      <View style={styles.top}>
        <IconButton
          icon="chevron-left"
          variant={light ? "glass" : "white"}
          onPress={back}
          accessibilityLabel="Voltar"
        />
        <IconButton
          icon="share-2"
          variant={light ? "glass" : "white"}
          onPress={share}
          accessibilityLabel="Compartilhar cupom"
        />
      </View>

      <View style={styles.store}>
        <View style={[styles.logo, { backgroundColor: tone.tile }]}>
          <Icon name={coupon.store.icon} size={17} color={tone.fg} />
        </View>
        <Text style={styles.storeName} color={tone.fg} numberOfLines={1}>
          {block ? `${coupon.store.name} · ${block}` : coupon.store.name}
        </Text>
      </View>

      <Text
        style={[styles.big, light ? styles.shadowDark : styles.shadowLight]}
        color={tone.fg}
        numberOfLines={1}
        adjustsFontSizeToFit
        accessibilityRole="header"
      >
        {coupon.headline}
        {coupon.headlineSub ? (
          <Text style={styles.bigSub} color={tone.fgMuted}>
            {` ${coupon.headlineSub}`}
          </Text>
        ) : null}
      </Text>
      <Text style={[styles.title, light ? styles.shadowDark : styles.shadowLight]} color={tone.fg}>
        {coupon.title}
      </Text>
    </ToneSurface>
  );
}

/**
 * Miniatura WebP do ERP para a foto do hero. O `Image` do SVG não avisa erro: a miniatura é
 * conferida com `Image.prefetch` (o mesmo carregador nativo que o SVG usa, já deixa em cache)
 * e, se faltar no servidor, volta a original.
 */
function useVariantHref(url: string | null, displayWidth: number): string | null {
  const variant = url ? imageVariantUrl(url, imageWidthFor(displayWidth, PixelRatio.get())) : null;
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!variant || variant === url) return;
    let alive = true;
    const fail = () => {
      if (alive) setFailed(variant);
    };
    Image.prefetch(variant).then((ok) => {
      if (!ok) fail();
    }, fail);
    return () => {
      alive = false;
    };
  }, [variant, url]);

  return variant && variant !== failed ? variant : url;
}

const useStyles = createStyles((t) => ({
  // 34 do CSS + 24 que o corpo sobe por cima (margin-top: -24px)
  hero: { paddingHorizontal: layout.gutter, paddingBottom: 34 + 24 },
  photo: { position: "absolute", top: 0, right: 0, bottom: 0, width: `${PHOTO_PCT}%` },
  bigIcon: {
    position: "absolute",
    right: -24,
    bottom: -30,
    opacity: 0.14,
    transform: [{ rotate: "-14deg" }],
  },
  top: { flexDirection: "row", justifyContent: "space-between" },
  store: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 26 },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  storeName: { flexShrink: 1, fontFamily: fontFamily(650), fontSize: 15, lineHeight: 20 },
  big: {
    marginTop: 14,
    fontFamily: fontFamily(900),
    fontSize: 86,
    lineHeight: 86,
    letterSpacing: tracking(86, -0.065),
  },
  bigSub: { fontFamily: fontFamily(700), fontSize: 22, letterSpacing: tracking(22, -0.02) },
  title: {
    marginTop: 10,
    maxWidth: 300,
    fontFamily: fontFamily(700),
    fontSize: 21,
    lineHeight: 25,
    letterSpacing: tracking(21, -0.025),
  },
  shadowDark: {
    textShadowColor: withAlpha(t.colors.scrim, 0.25),
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 18,
  },
  // halo claro atrás do texto escuro (só o sand do tema claro usa)
  shadowLight: {
    textShadowColor: withAlpha(t.colors.bg, 0.7),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 14,
  },
}));
