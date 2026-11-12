import { View } from "react-native";
import type { ChallengeItem } from "@/contracts/app/challenges";
import {
  createStyles,
  Icon,
  motion,
  Pill,
  PressableScale,
  Text,
  tracking,
  useColors,
} from "@/design";

export type ChallengeRowProps = {
  challenge: ChallengeItem;
  /** Conquistado pelo visitante logado. */
  done: boolean;
  onPress: () => void;
};

/** Linha de desafio (.ch): ícone, título, como fazer e o status à direita. */
export function ChallengeRow({ challenge, done, onPress }: ChallengeRowProps) {
  const colors = useColors();
  const styles = useStyles();
  const qr = challenge.validation === "qr";
  // Trevos, uso único ou repetível e o produto do parceiro.
  const meta = [
    `+${challenge.points} ${challenge.points === 1 ? "Trevo" : "Trevos"}`,
    challenge.repeatable ? "Repetível" : "Uso único",
    challenge.product ? `Parceiro: ${challenge.product}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const a11y = `${challenge.title}. ${challenge.howTo}. ${meta}. ${
    done ? "Selo conquistado" : `Selo ${challenge.seal.name}, ${qr ? "ler QR Code" : "automático"}`
  }`;
  return (
    <PressableScale
      scaleTo={motion.pressScale.card}
      onPress={onPress}
      accessibilityLabel={a11y}
      style={[styles.row, done && styles.rowDone]}
    >
      <View style={[styles.ic, done && styles.icDone]}>
        <Icon name={challenge.icon} size={24} color={done ? colors.onBrand : colors.text} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title} weight={700} numberOfLines={2}>
          {challenge.title}
        </Text>
        <Text style={styles.how} tone="textMuted" numberOfLines={2}>
          {challenge.howTo}
        </Text>
        <Text style={styles.meta} tone="brandText" weight={700} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <View style={styles.st}>
        {done ? (
          <View style={styles.ok}>
            <Icon name="check" size={17} color={colors.onBrand} />
          </View>
        ) : (
          <Pill
            label={challenge.seal.name}
            icon={qr ? "qr-code" : "zap"}
            variant={qr ? "dark" : "white"}
            style={styles.pill}
          />
        )}
      </View>
    </PressableScale>
  );
}

const useStyles = createStyles((t) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 24,
    backgroundColor: t.colors.surface,
  },
  rowDone: { backgroundColor: t.colors.brand50 },
  ic: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: t.colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  icDone: { backgroundColor: t.colors.brand },
  text: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, lineHeight: 19, letterSpacing: tracking(15, -0.01) },
  how: { fontSize: 12.5, lineHeight: 17, marginTop: 3 },
  meta: { fontSize: 12, lineHeight: 16, marginTop: 4 },
  st: { flexShrink: 0, maxWidth: 130 },
  pill: { maxWidth: 130 },
  ok: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: t.colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
}));
