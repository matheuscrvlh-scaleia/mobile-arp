import { useRouter } from "expo-router";
import { View } from "react-native";
import {
  Countdown,
  createStyles,
  Icon,
  PressableScale,
  radii,
  Text,
  useColors,
  withAlpha,
} from "@/design";
import { plural } from "@/shared/lib/format";
import { useWallet } from "../api/coupons";
import { byExpiry } from "../lib/stock";

/**
 * Faixa escura da vitrine (.wallet-strip): quantos cupons ativos e quando vence o próximo.
 * `chrome`: escura nos dois temas (no escuro ganha o fio `chromeBorder`).
 */
export function WalletStrip() {
  const router = useRouter();
  const styles = useStyles();
  const colors = useColors();
  const wallet = useWallet("active");
  const first = wallet.data?.pages[0];
  const count = first?.counts.active ?? 0;
  const next = byExpiry(wallet.data?.pages.flatMap((p) => p.data) ?? [])[0];
  if (!first || count === 0 || !next) return null;

  const label = `${plural(count, "cupom", "cupons")} na sua carteira`;
  return (
    <PressableScale
      scaleTo={0.98}
      onPress={() => router.push("/carteira")}
      accessibilityLabel={`${label}. Abrir carteira`}
      style={styles.strip}
    >
      <View style={styles.icon}>
        <Icon name="ticket-check" color={colors.onBrand} />
      </View>
      <View style={styles.texts}>
        <Text variant="bodyStrong" tone="onChrome">
          {label}
        </Text>
        <Text variant="caption" weight={400} tone="onChromeMuted" style={styles.sub}>
          O próximo vence em{" "}
          <Countdown
            to={next.expiresAt}
            onEnd={() => void wallet.refetch()}
            variant="caption"
            weight={400}
            tone="onChromeMuted"
          />
        </Text>
      </View>
      <View style={styles.go}>
        <Icon name="chevron-right" size={18} color={colors.onChrome} />
      </View>
    </PressableScale>
  );
}

const useStyles = createStyles((t) => ({
  strip: {
    marginTop: 18,
    marginHorizontal: 20,
    paddingVertical: 14,
    paddingRight: 14,
    paddingLeft: 18,
    borderRadius: radii.lg,
    backgroundColor: t.colors.chrome,
    boxShadow: `inset 0 0 0 1px ${t.colors.chromeBorder}`,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radii.sm,
    backgroundColor: t.colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: { flex: 1, minWidth: 0 },
  sub: { marginTop: 2 },
  go: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: withAlpha(t.colors.onChrome, 0.1),
    alignItems: "center",
    justifyContent: "center",
  },
}));
