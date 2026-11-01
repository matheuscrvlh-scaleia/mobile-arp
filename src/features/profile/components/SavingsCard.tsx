import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import type { MonthSummary } from "@/contracts/app/auth";
import {
  createStyles,
  fontFamily,
  layout,
  Pill,
  RadialGlow,
  radii,
  Text,
  tracking,
  useColors,
} from "@/design";
import { formatMoneyShort } from "@/shared/lib/format";
import { splitMoney } from "../lib/profile";

const GLOW_CENTER = { x: 0.86, y: 0.1 };

/** Economia do visitante (.save-card): fundo escuro nos dois temas (chrome), brilho verde e linha decorativa. */
export function SavingsCard({ summary }: { summary: MonthSummary }) {
  const [whole, cents] = splitMoney(summary.savingsTotalCents);
  const month = summary.savingsMonthCents;
  const colors = useColors();
  const styles = useStyles();
  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`Você já economizou ${whole}${cents} na ARP`}
    >
      {/* .sc-glow: círculo verde desfocado no canto superior direito (~130 px de raio) */}
      <RadialGlow color={colors.brand} opacity={0.5} center={GLOW_CENTER} radius={0.38} />
      <Text variant="smallStrong" tone="onChromeMuted">
        Você já economizou na ARP
      </Text>
      <Text style={styles.big} tabular>
        {whole}
        <Text style={styles.cents}>{cents}</Text>
      </Text>
      <View style={styles.tags}>
        <Pill
          variant="glass"
          icon="trending-up"
          label={month > 0 ? `+${formatMoneyShort(month)} este mês` : "Nada ainda este mês"}
        />
      </View>
      <Svg width={120} height={48} viewBox="0 0 120 48" style={styles.spark}>
        <Path
          d="M2 42 L20 34 L36 37 L52 24 L70 28 L88 14 L104 18 L118 5"
          fill="none"
          stroke={colors.brand}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={118} cy={5} r={4.5} fill={colors.brand} />
      </Svg>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  card: {
    marginTop: 22,
    marginHorizontal: layout.gutter,
    padding: 22,
    borderRadius: radii.cardLg,
    backgroundColor: t.colors.chrome,
    overflow: "hidden",
    // no escuro o chrome é um degrau acima do fundo: fio claro de 1px no lugar da borda
    ...(t.dark ? { boxShadow: `inset 0 0 0 1px ${t.colors.chromeBorder}` } : null),
  },
  big: {
    fontFamily: fontFamily(850),
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: tracking(48, -0.055),
    color: t.colors.onChrome,
    marginTop: 6,
  },
  cents: { fontFamily: fontFamily(850), fontSize: 22, letterSpacing: 0, color: t.colors.onChrome },
  tags: { flexDirection: "row", gap: 8, marginTop: 10, paddingRight: 120 },
  spark: { position: "absolute", right: 20, bottom: 22 },
}));
