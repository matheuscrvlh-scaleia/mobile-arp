import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { View } from "react-native";
import type { MonthSummary } from "@/contracts/app/auth";
import {
  createStyles,
  cssAngle,
  DashedDivider,
  fontFamily,
  Icon,
  type IconName,
  layout,
  motion,
  PressableScale,
  radii,
  Text,
  Trevo,
  tracking,
  useColors,
  withAlpha,
} from "@/design";
import { openPath } from "@/navigation/navigate";
import { useNow } from "@/shared/hooks/useNow";
import { formatMoneyShort, monthName, plural } from "@/shared/lib/format";
import { daysLeftInMonth } from "../lib/home";

/* O cartão é verde da marca nos dois temas: texto e ícones em `onBrand` (ink), nunca `text`. */

/** .mcard do visitante logado: selos do mês, cupons ativos, economia, dias para fechar. */
export function MonthCard({ summary }: { summary: MonthSummary }) {
  const colors = useColors();
  const styles = useStyles();
  const now = useNow(60_000);
  const { clubPoints, activeClaims, savingsMonthCents } = summary;
  const daysLeft = daysLeftInMonth(now);
  const month = monthName(now);

  return (
    <PressableScale
      scaleTo={motion.pressScale.card}
      onPress={() => openPath("/desafios")}
      accessibilityLabel={`Seu ${month} na ARP: ${clubPoints} Trevos no Clube ARP. Ver o Clube`}
      style={styles.card}
    >
      <Trevo size={190} color={colors.onBrand} opacity={0.1} style={styles.watermark} />
      <View style={styles.top}>
        <View>
          <Label icon="sparkles">{`Seu ${month} na ARP`}</Label>
          <View style={styles.bigRow}>
            <Text style={styles.big} tabular>
              {clubPoints.toLocaleString("pt-BR")}
            </Text>
            <Text style={styles.bigSmall}>
              {clubPoints === 1 ? "Trevo no Clube" : "Trevos no Clube"}
            </Text>
          </View>
        </View>
        <View style={styles.ring}>
          <Trevo size={34} color={colors.onBrand} />
        </View>
      </View>
      <DashedDivider color={withAlpha(colors.onBrand, 0.2)} spacing={0} style={styles.dashed} />
      <View style={styles.stats}>
        <Stat
          value={String(activeClaims)}
          label={plural(activeClaims, "cupom ativo", "cupons ativos", false)}
        />
        <Stat value={formatMoneyShort(savingsMonthCents)} label="economizados" />
        <Stat value={`${daysLeft}d`} label="p/ fechar o mês" />
      </View>
    </PressableScale>
  );
}

/* Gradientes fixos dos 4 primeiros selos do protótipo (SEALS), só decoração (como a cor de selo
   que vem da API, iguais nos dois temas; o 1º termina no brand700). */
const DECOR_SEALS: { icon: IconName; grad: readonly [string, string] }[] = [
  { icon: "compass", grad: ["#7fd68d", "#2f7d3d"] },
  { icon: "recycle", grad: ["#9be0a5", "#3a9a4b"] },
  { icon: "utensils", grad: ["#f2b38a", "#c8692f"] },
  { icon: "party-popper", grad: ["#c7a3ff", "#7d5a8c"] },
];
const SEAL_DIR = cssAngle(145);

/** .mcard.guest: convite para criar conta. */
export function GuestMonthCard() {
  const colors = useColors();
  const styles = useStyles();
  const router = useRouter();
  return (
    <PressableScale
      scaleTo={motion.pressScale.card}
      onPress={() => router.push("/cadastro")}
      accessibilityLabel="Ganhe selos e benefícios só por estar aqui. Criar conta grátis"
      style={styles.card}
    >
      <Trevo size={190} color={colors.onBrand} opacity={0.1} style={styles.watermark} />
      <Label icon="sparkles">Viva a ARP</Label>
      <Text style={styles.guestTitle}>Ganhe selos e benefícios só por estar aqui</Text>
      <Text style={styles.guestText}>
        Faça o tour, vá a um evento, pegue cupons. Cada desafio vale um selo.
      </Text>
      <View style={styles.guestFoot}>
        <View style={styles.cta}>
          <Text style={styles.ctaText} tone="onInverse">
            Criar conta grátis
          </Text>
          <Icon name="arrow-right" size={18} color={colors.onInverse} />
        </View>
        <View style={styles.sealRow}>
          {DECOR_SEALS.map((s, i) => (
            <LinearGradient
              key={s.icon}
              colors={s.grad}
              start={SEAL_DIR.start}
              end={SEAL_DIR.end}
              style={[styles.seal, i > 0 && styles.sealOverlap]}
            >
              <Icon name={s.icon} size={15} color={colors.onMedia} />
            </LinearGradient>
          ))}
        </View>
      </View>
    </PressableScale>
  );
}

function Label({ icon, children }: { icon: IconName; children: string }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.label}>
      <Icon name={icon} size={16} color={colors.onBrand} />
      <Text style={styles.labelText}>{children}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit tabular>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const RING = { size: 58 };

const useStyles = createStyles((t) => ({
  card: {
    marginTop: 26,
    marginHorizontal: layout.gutter,
    borderRadius: radii.cardLg,
    padding: 22,
    backgroundColor: t.colors.brand,
    overflow: "hidden",
  },
  watermark: { position: "absolute", right: -50, bottom: -70 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  label: { flexDirection: "row", alignItems: "center", gap: 6, opacity: 0.8 },
  labelText: { color: t.colors.onBrand, fontFamily: fontFamily(650), fontSize: 13, lineHeight: 17 },
  bigRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: 8 },
  big: {
    color: t.colors.onBrand,
    fontFamily: fontFamily(850),
    fontSize: 60,
    lineHeight: 62,
    letterSpacing: tracking(60, -0.06),
  },
  bigSmall: {
    color: t.colors.onBrand,
    fontFamily: fontFamily(700),
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: tracking(22, -0.02),
    marginBottom: 8,
    opacity: 0.7,
  },
  ring: {
    width: RING.size,
    height: RING.size,
    borderRadius: RING.size / 2,
    // medalha branca sobre o verde, igual nos dois temas
    backgroundColor: t.colors.onMedia,
    alignItems: "center",
    justifyContent: "center",
  },
  dashed: { marginTop: 18, marginBottom: 14 },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1 },
  statValue: {
    color: t.colors.onBrand,
    fontFamily: fontFamily(800),
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: tracking(22, -0.04),
  },
  statLabel: {
    color: t.colors.onBrand,
    fontFamily: fontFamily(550),
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.72,
  },
  guestTitle: {
    color: t.colors.onBrand,
    fontFamily: fontFamily(800),
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: tracking(26, -0.04),
    marginTop: 10,
    marginBottom: 6,
    maxWidth: 240,
  },
  guestText: {
    color: t.colors.onBrand,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.78,
    maxWidth: 250,
    marginBottom: 16,
  },
  guestFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: t.colors.inverse,
  },
  ctaText: { fontFamily: fontFamily(700), fontSize: 14, lineHeight: 18 },
  sealRow: { flexDirection: "row" },
  seal: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2.5,
    borderColor: t.colors.brand,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sealOverlap: { marginLeft: -10 },
}));
