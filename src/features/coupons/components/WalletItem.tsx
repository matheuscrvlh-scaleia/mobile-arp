import { useRouter } from "expo-router";
import { View } from "react-native";
import type { Claim, WalletStatus } from "@/contracts/app/coupons";
import { mediaUrl } from "@/core/api/media";
import {
  Countdown,
  createStyles,
  fontFamily,
  Icon,
  Photo,
  Pill,
  PressableScale,
  radii,
  Text,
  tracking,
  useColors,
  useTheme,
} from "@/design";
import { CLAIM_STATUS, pillLabel } from "../lib/claim-status";

type WalletItemProps = {
  claim: Claim;
  /** Situação já considerando o prazo vencido offline (`effectiveStatus`). */
  status: WalletStatus;
  /** Prazo zerou na tela: a lista confere com a API. */
  onExpire?: () => void;
};

/** Item da carteira (.wl-item): foto, título, "loja · código" e a situação. */
export function WalletItem({ claim, status, onExpire }: WalletItemProps) {
  const router = useRouter();
  const styles = useStyles();
  const { toneOf } = useTheme();
  const photo = mediaUrl(claim.coupon.imageUrl);
  const tone = toneOf(claim.coupon.tone);

  return (
    <PressableScale
      scaleTo={0.98}
      onPress={() => router.push(`/carteira/${claim.id}`)}
      accessibilityLabel={`${claim.coupon.title}, ${claim.store.name}, código ${claim.code}`}
      style={styles.item}
    >
      {photo ? (
        // 66×74 em "cover": a altura manda na escala
        <Photo source={photo} displayWidth={74} recyclingKey={claim.id} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.tile, { backgroundColor: tone.gradient[1] }]}>
          <Icon name={claim.coupon.icon} size={26} color={tone.fg} />
        </View>
      )}
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={1}>
          {claim.coupon.title}
        </Text>
        <Text variant="small" tone="textMuted" numberOfLines={1} style={styles.sub}>
          {claim.store.name} · {claim.code}
        </Text>
        <View style={styles.meta}>
          <StatusPill claim={claim} status={status} onExpire={onExpire} />
        </View>
      </View>
    </PressableScale>
  );
}

function StatusPill({ claim, status, onExpire }: WalletItemProps) {
  const styles = useStyles();
  const colors = useColors();
  const pill = CLAIM_STATUS[status].pill;
  const label = pillLabel(claim, status);
  if (pill && label) return <Pill variant={pill.variant} icon={pill.icon} label={label} />;
  return (
    <View style={styles.cdPill}>
      <Icon name={CLAIM_STATUS[status].icon} size={13} color={colors.onInverse} />
      <Countdown
        to={claim.expiresAt}
        onEnd={onExpire}
        style={styles.cdText}
        color={colors.onInverse}
      />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: radii.xl,
    backgroundColor: t.colors.surface,
  },
  photo: {
    width: 66,
    height: 74,
    borderRadius: 16,
    ...t.shadows.hairline,
  },
  tile: { alignItems: "center", justifyContent: "center" },
  texts: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: fontFamily(700),
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: tracking(15, -0.01),
  },
  sub: { marginTop: 2 },
  meta: { marginTop: 8 },
  cdPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    // pílula escura do contador (= Pill "dark"): clara no tema escuro
    backgroundColor: t.colors.inverse,
  },
  cdText: { fontFamily: fontFamily(650), fontSize: 12, lineHeight: 16 },
}));
