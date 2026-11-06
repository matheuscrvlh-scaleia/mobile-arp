import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import type { CouponCard as CouponCardData } from "@/contracts/app/coupons";
import { mediaUrl } from "@/core/api/media";
import {
  createStyles,
  DashedDivider,
  fontFamily,
  Icon,
  Photo,
  Pill,
  PressableScale,
  ProgressBar,
  RadialGlow,
  radii,
  Text,
  ToneSurface,
  tracking,
  useTheme,
  withAlpha,
} from "@/design";
import { formatDayMonth } from "@/shared/lib/format";
import { isSoldOut, isUrgent, stockRatio } from "../lib/stock";

export type CouponCardProps = { coupon: CouponCardData };

const STUB = 96;
const BITE = 22;
/** Foto do canhoto (pt). */
const PHOTO = 72;
const GLOW_CENTER = { x: 1.1, y: 0.12 };

/** Cupom da vitrine (.cp): bilhete no tom do cupom, com canhoto à direita (foto e prazo). */
export function CouponCard({ coupon }: CouponCardProps) {
  const router = useRouter();
  const styles = useStyles();
  const { colors, toneOf } = useTheme();
  const tone = toneOf(coupon.tone);
  const soldOut = isSoldOut(coupon.stock);
  const { remaining } = coupon.stock;
  const urgent = isUrgent(remaining);
  const photo = mediaUrl(coupon.imageUrl);
  const headline = coupon.headlineSub
    ? `${coupon.headline} ${coupon.headlineSub}`
    : coupon.headline;

  return (
    <PressableScale
      scaleTo={0.98}
      onPress={() => router.push(`/cupom/${coupon.id}`)}
      accessibilityLabel={`${coupon.store.name}: ${headline}, ${coupon.title}. ${
        soldOut ? "Esgotado" : `Restam ${remaining}`
      }`}
      style={soldOut && styles.soldOut}
    >
      {/* isolation só no esgotado: o "saturation" da camada cinza não pode vazar do cartão */}
      <ToneSurface tone={coupon.tone} style={[styles.card, soldOut && styles.isolate]}>
        {/* .glow: círculo branco desfocado de 220 px saindo pelo canto superior direito */}
        <RadialGlow color={colors.onMedia} opacity={0.18} center={GLOW_CENTER} radius={0.32} />
        <View style={styles.main}>
          <View style={styles.store}>
            <View style={[styles.logo, { backgroundColor: tone.tile }]}>
              <Icon name={coupon.store.icon} size={14} color={tone.fg} />
            </View>
            <Text style={styles.storeName} color={tone.fg} numberOfLines={1}>
              {coupon.store.name}
            </Text>
          </View>
          <Text style={styles.big} color={tone.fg} numberOfLines={1} adjustsFontSizeToFit>
            {coupon.headline}
            {coupon.headlineSub ? (
              <Text style={styles.bigSub} color={tone.fgMuted}>
                {` ${coupon.headlineSub}`}
              </Text>
            ) : null}
          </Text>
          <Text style={styles.title} color={tone.fgMuted} numberOfLines={1}>
            {coupon.title}
          </Text>
          <View style={styles.foot}>
            {soldOut ? (
              <Text style={styles.footText} color={tone.fg}>
                Pode voltar se alguém não usar
              </Text>
            ) : (
              <>
                <ProgressBar
                  value={stockRatio(coupon.stock)}
                  trackColor={tone.barTrack}
                  fillColor={tone.barFill}
                  style={styles.bar}
                />
                <Text
                  style={[styles.footText, urgent && styles.urgent]}
                  color={urgent ? colors.onMedia : tone.fg}
                >
                  restam {remaining}
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.stub}>
          <DashedDivider vertical thickness={2} color={tone.stubLine} style={styles.stubLine} />
          <View style={[styles.bite, styles.biteTop]} />
          <View style={[styles.bite, styles.biteBottom]} />
          {photo ? (
            <Photo
              source={photo}
              displayWidth={PHOTO}
              recyclingKey={coupon.id}
              style={styles.photo}
            />
          ) : (
            <View style={[styles.tile, { backgroundColor: tone.tile }]}>
              <Icon name={coupon.icon} size={28} color={tone.fg} />
            </View>
          )}
          <Text style={styles.hours} color={tone.fgMuted}>
            {coupon.useUntil
              ? `até ${formatDayMonth(coupon.useUntil)}`
              : `${coupon.redeemWindowHours}h p/ usar`}
          </Text>
        </View>

        {soldOut ? (
          <>
            {/* grayscale(.85) do .soldout: camada cinza em modo "saturation" (iOS e Android) */}
            <View style={styles.desaturate} />
            <Pill label="Esgotado" variant="dark" style={styles.soTag} />
          </>
        ) : null}
      </ToneSurface>
    </PressableScale>
  );
}

/* Cinza neutro: com mixBlendMode "saturation" só a saturação (zero) da camada conta, então
   vale igual nos dois temas. */
const DESATURATE = "rgba(128, 128, 128, 0.85)";

const useStyles = createStyles((t) => ({
  soldOut: { opacity: 0.7 },
  card: {
    flexDirection: "row",
    minHeight: 168,
    borderRadius: radii.card,
  },
  isolate: { isolation: "isolate" },
  main: {
    flex: 1,
    minWidth: 0,
    paddingTop: 18,
    paddingRight: 4,
    paddingBottom: 16,
    paddingLeft: 18,
  },
  store: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  storeName: { flexShrink: 1, fontFamily: fontFamily(650), fontSize: 13, lineHeight: 17 },
  big: {
    marginTop: 12,
    fontFamily: fontFamily(850),
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: tracking(40, -0.055),
  },
  bigSub: {
    fontFamily: fontFamily(650),
    fontSize: 15,
    letterSpacing: tracking(15, -0.01),
  },
  title: { marginTop: 4, fontSize: 14, lineHeight: 19 },
  foot: {
    marginTop: "auto",
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bar: { flex: 1, maxWidth: 120 },
  footText: { fontFamily: fontFamily(650), fontSize: 12, lineHeight: 16 },
  urgent: {
    backgroundColor: t.colors.danger,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.xs,
    overflow: "hidden",
  },
  stub: { width: STUB, alignItems: "center", justifyContent: "center", gap: 10 },
  stubLine: { position: "absolute", left: 0, top: 0, bottom: 0 },
  // "mordidas" do bilhete: círculos da cor do fundo da tela (`bg`: vitrine e página da loja)
  // sobre a linha do canhoto
  bite: {
    position: "absolute",
    left: -12,
    width: BITE,
    height: BITE,
    borderRadius: BITE / 2,
    backgroundColor: t.colors.bg,
  },
  biteTop: { top: -11 },
  biteBottom: { bottom: -11 },
  photo: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: withAlpha(t.colors.onMedia, 0.75),
    transform: [{ rotate: "-8deg" }],
    boxShadow: `0 12px 22px -10px ${withAlpha(t.colors.scrim, 0.5)}`,
  },
  tile: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-8deg" }],
    boxShadow: `inset 0 1px 0 ${withAlpha(t.colors.onMedia, 0.35)}`,
  },
  hours: { fontFamily: fontFamily(700), fontSize: 11, lineHeight: 14 },
  desaturate: {
    ...StyleSheet.absoluteFill,
    backgroundColor: DESATURATE,
    mixBlendMode: "saturation",
    pointerEvents: "none",
  },
  soTag: { position: "absolute", top: 16, right: STUB + 14 },
}));
