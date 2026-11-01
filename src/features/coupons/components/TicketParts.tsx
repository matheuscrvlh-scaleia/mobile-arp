import { type ReactNode, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { Claim, WalletStatus } from "@/contracts/app/coupons";
import {
  Countdown,
  CountdownBar,
  createStyles,
  DashedDivider,
  easings,
  fontFamily,
  Icon,
  type IconName,
  type Palette,
  Text,
  type ThemeColor,
  tracking,
  useColors,
  useTheme,
  withAlpha,
} from "@/design";
import { assertNever } from "@/shared/lib/assert";
import { formatDayMonth, formatMoneyShort, formatTime } from "@/shared/lib/format";
import { CLAIM_STATUS, type StatusTone } from "../lib/claim-status";

/**
 * Fundo da tela do bilhete (nome da cor do tema): as "mordidas" do picote usam a mesma cor.
 * Verde da marca nos dois temas.
 */
export const TICKET_SCREEN_BG: ThemeColor = "brand";

/** Cor do carimbo por tom do status (sobre o papel do bilhete). */
const TONE_COLOR: Record<StatusTone, keyof Palette> = { brand: "brandText", clay: "danger" };

type FootProps = { claim: Claim; status: WalletStatus; onExpire: () => void };

/** Rodapé do bilhete: prazo correndo, ou o que aconteceu com o pego. */
export function TicketFoot({ claim, status, onExpire }: FootProps) {
  const styles = useStyles();
  const { colors, gradients } = useTheme();
  const spec = CLAIM_STATUS[status];
  const timer = (children: ReactNode) => (
    <Timer label={spec.label} icon={spec.icon} clay={spec.tone === "clay"}>
      {children}
    </Timer>
  );
  switch (status) {
    case "active":
      return (
        <>
          {timer(<Countdown to={claim.expiresAt} onEnd={onExpire} style={styles.timerValue} />)}
          <CountdownBar
            from={claim.claimedAt}
            to={claim.expiresAt}
            height={8}
            trackColor={colors.surface}
            gradient={gradients.brandBar.colors}
            style={styles.progress}
            accessibilityLabel="Tempo que resta para usar"
          />
          <Where icon="store">Mostre este código no caixa da {claim.store.name}</Where>
        </>
      );
    case "used": {
      const at = claim.redeemedAt;
      const saved = claim.coupon.savingsCents;
      return (
        <>
          {timer(
            <Text style={styles.timerValue} tabular>
              {at ? `${formatDayMonth(at)} às ${formatTime(at)}` : "Validado pela loja"}
            </Text>,
          )}
          <Where icon="heart">
            {saved
              ? `Bom proveito! Você economizou ${formatMoneyShort(saved)} com a ARP.`
              : "Bom proveito! Você economizou com a ARP."}
          </Where>
        </>
      );
    }
    case "cancelled":
      return (
        <>
          {timer(<Text style={[styles.timerValue, styles.timerSmall]}>Cancelado pela loja</Text>)}
          <Where icon="info">
            Este código não vale mais. Fale com a {claim.store.name} se tiver dúvida.
          </Where>
        </>
      );
    case "expired":
      return (
        <>
          {timer(
            <Text style={[styles.timerValue, styles.timerSmall]}>Voltou para a promoção</Text>,
          )}
          <Where icon="info">Outra pessoa pode pegar. Se ainda tiver, você também.</Where>
        </>
      );
    default:
      return assertNever(status);
  }
}

function Timer({
  label,
  icon,
  clay,
  children,
}: {
  label: string;
  icon: IconName;
  clay: boolean;
  children: ReactNode;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.timer}>
      <View style={styles.timerText}>
        <Text style={styles.timerLabel} tone="textMuted">
          {label}
        </Text>
        {children}
      </View>
      <View style={[styles.timerIcon, clay && styles.timerIconClay]}>
        <Icon name={icon} color={clay ? colors.dangerText : colors.brandText} />
      </View>
    </View>
  );
}

function Where({ icon, children }: { icon: IconName; children: ReactNode }) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.where}>
      <Icon name={icon} size={16} color={colors.textMuted} />
      <Text variant="small" tone="textMuted" style={styles.whereText}>
        {children}
      </Text>
    </View>
  );
}

/** Picote (.tear): linha tracejada com meia-lua dos dois lados, na cor do fundo da tela. */
export function Tear() {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.tear}>
      <DashedDivider thickness={2} color={colors.border} spacing={0} />
      <View style={[styles.bite, styles.biteLeft]} />
      <View style={[styles.bite, styles.biteRight]} />
    </View>
  );
}

/** Carimbo (.stamp) do status, que entra grande e assenta (@keyframes stamp). */
export function StatusStamp({ status }: { status: WalletStatus }) {
  const colors = useColors();
  const spec = CLAIM_STATUS[status];
  if (!spec.stamp) return null;
  return (
    <Stamp label={spec.stamp.text} icon={spec.stamp.icon} color={colors[TONE_COLOR[spec.tone]]} />
  );
}

function Stamp({ label, icon, color }: { label: string; icon?: IconName; color: string }) {
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const p = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (!reduceMotion) p.set(withTiming(1, { duration: 500, easing: easings.spring }));
  }, [p, reduceMotion]);
  const anim = useAnimatedStyle(() => {
    const v = p.get();
    return {
      opacity: Math.min(1, v * 1.5),
      transform: [{ rotate: "-14deg" }, { scale: 2.2 - 1.2 * v }],
    };
  });
  return (
    <View style={styles.stampWrap} accessible accessibilityLabel={label}>
      <Animated.View style={[styles.stamp, { borderColor: color }, anim]}>
        {icon ? <Icon name={icon} size={28} color={color} strokeWidth={3} /> : null}
        <Text style={styles.stampText} color={color}>
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}

const BITE = 28;

const useStyles = createStyles((t) => ({
  tear: { marginHorizontal: 26, justifyContent: "center" },
  bite: {
    position: "absolute",
    top: -BITE / 2 + 1,
    width: BITE,
    height: BITE,
    borderRadius: BITE / 2,
    backgroundColor: t.colors[TICKET_SCREEN_BG],
  },
  biteLeft: { left: -41 },
  biteRight: { right: -41 },
  stampWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  stamp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 4,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 18,
    // papel do bilhete translúcido: o carimbo fica escuro no tema escuro, com a cor do status
    backgroundColor: withAlpha(t.colors.surfaceRaised, 0.9),
  },
  stampText: {
    fontFamily: fontFamily(900),
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: tracking(30, 0.08),
  },
  timer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  timerText: { flex: 1 },
  timerLabel: {
    fontFamily: fontFamily(600),
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: tracking(12, 0.06),
    textTransform: "uppercase",
  },
  timerValue: {
    fontFamily: fontFamily(850),
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: tracking(30, -0.03),
    color: t.colors.text,
  },
  timerSmall: { fontSize: 20, lineHeight: 26 },
  timerIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: t.colors.brand50,
    alignItems: "center",
    justifyContent: "center",
  },
  timerIconClay: { backgroundColor: t.colors.dangerSoft },
  progress: { marginTop: 12 },
  where: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  whereText: { flex: 1 },
}));
