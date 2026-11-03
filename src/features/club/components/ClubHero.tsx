import { View } from "react-native";
import type { ClubPoints } from "@/contracts/app/club";
import {
  createStyles,
  fontFamily,
  ProgressBar,
  RadialGlow,
  Text,
  Trevo,
  tracking,
  useColors,
  withAlpha,
} from "@/design";
import { dayMonth, formatPoints, nextPrizePercent } from "../lib/club";

/** Cartão escuro do Clube ARP: pontos, até quando valem e o próximo prêmio. */
export function ClubHero({ points }: { points: ClubPoints | null }) {
  const colors = useColors();
  const styles = useStyles();
  const sub = withAlpha(colors.onChrome, 0.65);
  const next = points?.nextPrize ?? null;

  return (
    <View style={styles.hero}>
      <RadialGlow color={colors.brand} opacity={0.55} center={{ x: 1, y: 0 }} radius={0.72} />
      <Trevo size={170} color={colors.brand} opacity={0.07} style={styles.wm} />
      <Text variant="caption" style={styles.k} color={colors.brand}>
        Clube ARP
      </Text>
      {points ? (
        <>
          <Text style={styles.h2} tone="onChrome" accessibilityRole="header">
            {formatPoints(points.total)}
          </Text>
          <Text variant="small" color={sub}>
            {points.validUntil
              ? `Os primeiros vencem em ${dayMonth(points.validUntil)}`
              : "Cumpra desafios para ganhar pontos"}
          </Text>
          {next ? (
            <View style={styles.next}>
              <ProgressBar
                value={nextPrizePercent(points.total, next.points) / 100}
                fillColor={colors.brand}
                trackColor={withAlpha(colors.onChrome, 0.12)}
                accessibilityLabel={`Faltam ${next.missing} pontos para ${next.name}`}
              />
              <Text variant="small" color={sub} style={styles.nextText}>
                Faltam {formatPoints(next.missing)} para {next.name}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.h2} tone="onChrome" accessibilityRole="header">
            Junte pontos
          </Text>
          <Text variant="small" color={sub}>
            Crie sua conta, cumpra desafios e troque os pontos por prêmios.
          </Text>
        </>
      )}
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
  k: { textTransform: "uppercase", letterSpacing: tracking(12, 0.12) },
  h2: {
    fontFamily: fontFamily(850),
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: tracking(34, -0.04),
    marginTop: 6,
    marginBottom: 2,
  },
  next: { marginTop: 18, gap: 8 },
  nextText: { fontSize: 13 },
}));
