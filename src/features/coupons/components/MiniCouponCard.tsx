import { useRouter } from "expo-router";
import { View } from "react-native";
import type { CouponCard } from "@/contracts/app/coupons";
import { mediaUrl } from "@/core/api/media";
import {
  createStyles,
  fontFamily,
  Icon,
  Photo,
  PressableScale,
  ProgressBar,
  radii,
  Text,
  ToneSurface,
  tracking,
  useTheme,
  withAlpha,
} from "@/design";
import { isUrgent, stockRatio } from "../lib/stock";

export type MiniCouponCardProps = { coupon: CouponCard };

export const MINI_COUPON_WIDTH = 236;
/** Foto no canto (pt). */
const PHOTO = 54;

/** Cupom pequeno da faixa "Cupons acabando" da home (.mini-cp). */
export function MiniCouponCard({ coupon }: MiniCouponCardProps) {
  const router = useRouter();
  const styles = useStyles();
  const { colors, toneOf } = useTheme();
  const tone = toneOf(coupon.tone);
  const { remaining } = coupon.stock;
  const urgent = isUrgent(remaining);
  const photo = mediaUrl(coupon.imageUrl);

  return (
    <PressableScale
      onPress={() => router.push(`/cupom/${coupon.id}`)}
      accessibilityLabel={`${coupon.store.name}: ${coupon.headline}${
        coupon.headlineSub ? ` ${coupon.headlineSub}` : ""
      }, ${coupon.title}. Restam ${remaining}`}
    >
      <ToneSurface tone={coupon.tone} style={styles.card}>
        {photo ? (
          <Photo
            source={photo}
            displayWidth={PHOTO}
            recyclingKey={coupon.id}
            style={styles.photo}
          />
        ) : (
          <View style={[styles.photo, styles.tile, { backgroundColor: tone.tile }]}>
            <Icon name={coupon.icon} size={24} color={tone.fg} />
          </View>
        )}
        <View style={styles.store}>
          <View style={[styles.logo, { backgroundColor: tone.tile }]}>
            <Icon name={coupon.store.icon} size={13} color={tone.fg} />
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
            {remaining > 0 ? `restam ${remaining}` : "Esgotado"}
          </Text>
        </View>
      </ToneSurface>
    </PressableScale>
  );
}

const useStyles = createStyles((t) => ({
  card: { width: MINI_COUPON_WIDTH, borderRadius: radii.xl, padding: 16 },
  photo: {
    position: "absolute",
    top: 12,
    right: 12,
    width: PHOTO,
    height: PHOTO,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: withAlpha(t.colors.onMedia, 0.7),
    transform: [{ rotate: "6deg" }],
    boxShadow: `0 10px 18px -8px ${withAlpha(t.colors.scrim, 0.45)}`,
  },
  tile: { alignItems: "center", justifyContent: "center" },
  store: { flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 60 },
  logo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  storeName: { flexShrink: 1, fontFamily: fontFamily(650), fontSize: 13, lineHeight: 17 },
  big: {
    marginTop: 12,
    marginBottom: 2,
    paddingRight: 60,
    fontFamily: fontFamily(850),
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: tracking(34, -0.05),
  },
  bigSub: { fontFamily: fontFamily(650), fontSize: 14, letterSpacing: 0 },
  title: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  foot: { flexDirection: "row", alignItems: "center", gap: 10 },
  bar: { flex: 1 },
  footText: { fontFamily: fontFamily(700), fontSize: 12, lineHeight: 16 },
  urgent: {
    backgroundColor: t.colors.danger,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.xs,
    overflow: "hidden",
  },
}));
