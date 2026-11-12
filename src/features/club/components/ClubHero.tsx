import { View } from "react-native";
import type { ClubPoints } from "@/contracts/app/club";
import {
  createStyles,
  fontFamily,
  Icon,
  type IconName,
  motion,
  PressableScale,
  ProgressBar,
  RadialGlow,
  Text,
  Trevo,
  tracking,
  useColors,
  withAlpha,
} from "@/design";
import { formatTrevos, fullDate, nextPrizePercent } from "../lib/club";

type Chip = { icon: IconName; label: string; onPress?: () => void; accessibilityLabel?: string };

/**
 * Cartão escuro do Clube ARP: chips do mês (desafios e quanto falta), saldo
 * de Trevos, até quando valem, o próximo prêmio e os atalhos para os selos e
 * as recompensas.
 */
export function ClubHero({
  points,
  chips = [],
  onSeals,
  onRewards,
}: {
  points: ClubPoints | null;
  chips?: Chip[];
  onSeals?: () => void;
  onRewards?: () => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  const sub = withAlpha(colors.onChrome, 0.65);
  const next = points?.nextPrize ?? null;

  return (
    <View style={styles.hero}>
      <RadialGlow color={colors.brand} opacity={0.55} center={{ x: 1, y: 0 }} radius={0.72} />
      <Trevo size={170} color={colors.brand} opacity={0.07} style={styles.wm} />
      {chips.length > 0 ? (
        <View style={styles.chips}>
          {chips.map((c) => (
            <PressableScale
              key={c.label}
              scaleTo={motion.pressScale.icon}
              onPress={c.onPress}
              disabled={!c.onPress}
              accessibilityRole={c.onPress ? "button" : "text"}
              accessibilityLabel={c.accessibilityLabel ?? c.label}
              style={styles.chip}
            >
              <Icon name={c.icon} size={14} color={colors.onChrome} />
              <Text variant="caption" weight={700} tone="onChrome">
                {c.label}
              </Text>
              {c.onPress ? <Icon name="chevron-right" size={13} color={sub} /> : null}
            </PressableScale>
          ))}
        </View>
      ) : (
        <Text variant="caption" style={styles.k} color={colors.brand}>
          Clube ARP
        </Text>
      )}
      {points ? (
        <>
          <View style={styles.balance}>
            <Trevo size={26} color={colors.brand} />
            <Text style={styles.h2} tone="onChrome" accessibilityRole="header">
              {formatTrevos(points.total)}
            </Text>
          </View>
          <Text variant="small" color={sub}>
            {points.validUntil
              ? `Seus Trevos valem até ${fullDate(points.validUntil)} para trocar`
              : "Cumpra desafios para ganhar Trevos"}
          </Text>
          {next ? (
            <View style={styles.next}>
              <View style={styles.nextRow}>
                <Text variant="caption" color={sub}>
                  Próxima recompensa
                </Text>
                <Text variant="caption" weight={700} tone="onChrome" tabular>
                  {points.total}/{next.points}
                </Text>
              </View>
              <ProgressBar
                value={nextPrizePercent(points.total, next.points) / 100}
                fillColor={colors.brand}
                trackColor={withAlpha(colors.onChrome, 0.12)}
                accessibilityLabel={`Faltam ${next.missing} Trevos para ${next.name}`}
              />
              <Text variant="small" color={sub} style={styles.nextText}>
                Faltam {formatTrevos(next.missing)} para: {next.name}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.h2} tone="onChrome" accessibilityRole="header">
            Junte Trevos
          </Text>
          <Text variant="small" color={sub}>
            Crie sua conta, cumpra desafios, ganhe selos e troque os Trevos por prêmios.
          </Text>
        </>
      )}
      {onSeals || onRewards ? (
        <View style={styles.actions}>
          {onSeals ? (
            <HeroAction icon="award" title="Meus selos" text="Suas conquistas" onPress={onSeals} />
          ) : null}
          {onRewards ? (
            <HeroAction
              icon="gift"
              title="Recompensas"
              text="Troque seus Trevos"
              onPress={onRewards}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function HeroAction({
  icon,
  title,
  text,
  onPress,
}: {
  icon: IconName;
  title: string;
  text: string;
  onPress: () => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <PressableScale
      scaleTo={motion.pressScale.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${text}`}
      style={styles.action}
    >
      <Icon name={icon} size={18} color={colors.brand} />
      <Text variant="smallStrong" tone="onChrome">
        {title}
      </Text>
      <Text variant="caption" color={withAlpha(colors.onChrome, 0.6)}>
        {text}
      </Text>
    </PressableScale>
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: withAlpha(t.colors.onChrome, 0.1),
  },
  balance: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  h2: {
    fontFamily: fontFamily(850),
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: tracking(34, -0.04),
    marginTop: 2,
    marginBottom: 2,
  },
  next: { marginTop: 18, gap: 8 },
  nextRow: { flexDirection: "row", justifyContent: "space-between" },
  nextText: { fontSize: 13 },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  action: {
    flex: 1,
    gap: 2,
    padding: 12,
    borderRadius: 18,
    backgroundColor: withAlpha(t.colors.onChrome, 0.08),
  },
}));
