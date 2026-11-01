import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { CampaignProgress } from "@/contracts/app/challenges";
import {
  createStyles,
  cssAngle,
  easings,
  fontFamily,
  Icon,
  Pill,
  RadialGlow,
  Text,
  Trevo,
  tracking,
  useColors,
  withAlpha,
} from "@/design";
import { barPercent, nextTierText } from "../lib/progress";

export type ChallengesHeroProps = {
  campaignLabel: string;
  daysLabel: string;
  progress: CampaignProgress;
  signedIn: boolean;
};

const BAR_DIR = cssAngle(90);
// radial-gradient(circle at 100% 0%, rgba(88,192,105,.55), transparent 55%): 55% da distância
// ao canto mais longe de um hero ~350×290 ≈ 72% do maior lado.
const GLOW_CENTER = { x: 1, y: 0 };
/** Começo do gradiente da barra (verde da marca um pouco mais escuro; igual nos dois temas). */
const BAR_FROM = "#4fb260";

/** Hero escuro dos desafios (.qhero): mês, dias, contagem, barra e faixas. Fica `chrome` nos
    dois temas (no escuro, um degrau acima do fundo com o fio `chromeBorder`). */
export function ChallengesHero({
  campaignLabel,
  daysLabel,
  progress,
  signedIn,
}: ChallengesHeroProps) {
  const colors = useColors();
  const styles = useStyles();
  const sub = withAlpha(colors.onChrome, 0.6);
  const tierMuted = withAlpha(colors.onChrome, 0.7);
  const earned = signedIn ? progress.earned : 0;
  const { total, tiers } = progress;
  const pct = barPercent(earned, total);

  return (
    <View style={styles.hero}>
      <RadialGlow color={colors.brand} opacity={0.55} center={GLOW_CENTER} radius={0.72} />
      <Trevo size={170} color={colors.brand} opacity={0.07} style={styles.wm} />
      <View style={styles.top}>
        <Pill
          label={campaignLabel}
          icon="calendar-days"
          variant="glass"
          style={styles.pillShrink}
        />
        <Pill label={daysLabel} icon="clock" variant="glass" />
      </View>
      <Text style={styles.h2} tone="onChrome" accessibilityRole="header">
        {signedIn ? `${earned} de ${total} selos` : "Comece sua coleção"}
      </Text>
      <Text variant="small" style={styles.sub} color={sub}>
        {signedIn ? nextTierText(progress) : "Crie sua conta e cumpra desafios para ganhar selos."}
      </Text>
      <ProgressTrack pct={pct} label={`${earned}/${total}`} />
      {tiers.length > 0 ? (
        <View style={styles.tiers}>
          {tiers.map((tier) => {
            const ok = signedIn && tier.reached;
            return (
              <View
                key={tier.threshold}
                style={[styles.tier, tiers.length > 2 && styles.tierWrap, ok && styles.tierOk]}
                accessible
                accessibilityLabel={`${tier.threshold} selos: ${tier.label}${ok ? ", alcançado" : ""}`}
              >
                <View style={[styles.tIc, ok && styles.tIcOk]}>
                  <Icon
                    name={ok ? "check" : tier.icon}
                    size={16}
                    color={ok ? colors.onBrand : tierMuted}
                  />
                </View>
                <View style={styles.tierText}>
                  <Text variant="smallStrong" weight={700} tone="onChrome">
                    {tier.threshold} selos
                  </Text>
                  <Text style={styles.tierLabel} color={tierMuted}>
                    {tier.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** .qbar: trilho translúcido e preenchimento em gradiente com "n/total" dentro. */
function ProgressTrack({ pct, label }: { pct: number; label: string }) {
  const colors = useColors();
  const styles = useStyles();
  const width = useSharedValue(pct);
  useEffect(() => {
    width.set(withTiming(pct, { duration: 1000, easing: easings.spring }));
  }, [pct, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.get()}%` }));

  return (
    <View
      style={styles.bar}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label} selos`}
    >
      <Animated.View style={[styles.fill, fill]}>
        <LinearGradient
          colors={[BAR_FROM, colors.brand]}
          start={BAR_DIR.start}
          end={BAR_DIR.end}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.fillShade} />
        <Text style={styles.fillText} tone="onBrand" tabular>
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  hero: {
    marginTop: 18,
    marginHorizontal: 20,
    padding: 22,
    borderRadius: 32,
    backgroundColor: t.colors.chrome,
    boxShadow: `inset 0 0 0 1px ${t.colors.chromeBorder}`,
    overflow: "hidden",
  },
  wm: { position: "absolute", right: -40, bottom: -50 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  pillShrink: { flexShrink: 1 },
  h2: {
    fontFamily: fontFamily(800),
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: tracking(26, -0.04),
    marginTop: 14,
    marginBottom: 2,
  },
  sub: { fontSize: 14, lineHeight: 19 },
  bar: {
    marginTop: 20,
    height: 40,
    borderRadius: 20,
    backgroundColor: withAlpha(t.colors.onChrome, 0.1),
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    minWidth: 64,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 14,
  },
  // box-shadow: inset 0 -3px 0 rgba(0,0,0,.12), inset 0 2px 0 rgba(255,255,255,.3)
  fillShade: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    boxShadow: `inset 0 -3px 0 ${withAlpha(t.colors.scrim, 0.12)}, inset 0 2px 0 ${withAlpha(t.colors.onMedia, 0.3)}`,
  },
  fillText: { fontFamily: fontFamily(800), fontSize: 15, lineHeight: 18 },
  tiers: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  tier: {
    flexGrow: 1,
    flexBasis: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 18,
    backgroundColor: withAlpha(t.colors.onChrome, 0.06),
  },
  tierWrap: { flexBasis: "45%" },
  tierOk: { backgroundColor: withAlpha(t.colors.brand, 0.16) },
  tIc: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: withAlpha(t.colors.onChrome, 0.1),
    alignItems: "center",
    justifyContent: "center",
  },
  tIcOk: { backgroundColor: t.colors.brand },
  tierText: { flex: 1, minWidth: 0 },
  tierLabel: { fontFamily: fontFamily(400), fontSize: 12, lineHeight: 16 },
}));
