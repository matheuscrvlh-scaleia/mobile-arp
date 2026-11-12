import { View } from "react-native";
import {
  createStyles,
  fontFamily,
  Icon,
  motion,
  PressableScale,
  RadialGlow,
  Text,
  Trevo,
  tracking,
  useColors,
  withAlpha,
} from "@/design";
import { formatTrevos, fullDate } from "../lib/club";

/**
 * Saldo de Trevos da Carteira (cartão escuro): quanto tem, até quando vale e
 * o atalho para o extrato. `total` null = sem login (convite para entrar).
 */
export function TrevoBalanceCard({
  total,
  validUntil,
  onStatement,
  onSignIn,
}: {
  total: number | null;
  validUntil: string | null;
  onStatement: () => void;
  onSignIn?: () => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  const sub = withAlpha(colors.onChrome, 0.65);
  return (
    <View style={styles.card}>
      <RadialGlow color={colors.brand} opacity={0.5} center={{ x: 1, y: 0 }} radius={0.8} />
      <Trevo size={140} color={colors.brand} opacity={0.08} style={styles.wm} />
      <View style={styles.head}>
        <Text variant="caption" color={sub}>
          Saldo disponível
        </Text>
        <Trevo size={20} color={colors.brand} />
      </View>
      {total === null ? (
        <>
          <Text style={styles.value} tone="onChrome">
            Junte Trevos
          </Text>
          <Text variant="small" color={sub}>
            Entre na sua conta para ver seus Trevos, cupons e conquistas.
          </Text>
        </>
      ) : (
        <>
          <View style={styles.row}>
            <Text style={styles.value} tone="onChrome" accessibilityRole="header">
              {total.toLocaleString("pt-BR")}
            </Text>
            <Text variant="smallStrong" color={colors.brand}>
              {total === 1 ? "Trevo" : "Trevos"}
            </Text>
          </View>
          <Text variant="caption" color={sub}>
            {validUntil
              ? `Validade: ${fullDate(validUntil)}`
              : "Cumpra desafios para ganhar Trevos"}
          </Text>
        </>
      )}
      <PressableScale
        scaleTo={motion.pressScale.button}
        onPress={total === null ? onSignIn : onStatement}
        accessibilityRole="button"
        accessibilityLabel={
          total === null ? "Entrar na conta" : `Ver extrato de Trevos. Saldo ${formatTrevos(total)}`
        }
        style={styles.link}
      >
        <Text variant="smallStrong" tone="onChrome" style={styles.linkText}>
          {total === null ? "Entrar" : "Ver extrato de Trevos"}
        </Text>
        <Icon name="arrow-right" size={16} color={colors.onChrome} />
      </PressableScale>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  card: {
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 28,
    backgroundColor: t.colors.chrome,
    boxShadow: `inset 0 0 0 1px ${t.colors.chromeBorder}`,
    overflow: "hidden",
    gap: 4,
  },
  wm: { position: "absolute", right: -30, bottom: -40 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  row: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  value: {
    fontFamily: fontFamily(850),
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: tracking(32, -0.04),
  },
  link: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: withAlpha(t.colors.onChrome, 0.1),
  },
  linkText: { flex: 1 },
}));
