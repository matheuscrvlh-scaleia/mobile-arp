import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import type { ChallengeItem } from "@/contracts/app/challenges";
import { createStyles, cssAngle, Icon, motion, PressableScale, Text, useColors } from "@/design";
import { openChallengeSheet } from "../sheets/challenge-sheet";

export type ChallengeCalloutProps = { challenge: ChallengeItem };

const DIR = cssAngle(145);

/** Faixa "Desafio do mês aqui" (.ch-callout) na loja/evento: abre o painel do desafio. */
export function ChallengeCallout({ challenge }: ChallengeCalloutProps) {
  const colors = useColors();
  const styles = useStyles();
  const { seal } = challenge;
  return (
    <PressableScale
      scaleTo={motion.pressScale.card}
      onPress={() => openChallengeSheet(challenge)}
      accessibilityLabel={`Desafio do mês aqui: ${challenge.title}. Ganhe o selo ${seal.name}`}
      accessibilityHint="Abre os detalhes do desafio"
      style={styles.box}
    >
      <LinearGradient
        colors={[seal.gradientFrom, seal.gradientTo]}
        start={DIR.start}
        end={DIR.end}
        style={styles.ic}
      >
        <Icon name={seal.icon} size={20} color={colors.onMedia} />
      </LinearGradient>
      <View style={styles.text}>
        <Text variant="bodyStrong" weight={700}>
          Desafio do mês aqui
        </Text>
        <Text variant="small" tone="brandText">
          {challenge.title} e ganhe o selo {seal.name}
        </Text>
      </View>
    </PressableScale>
  );
}

const useStyles = createStyles((t) => ({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: t.colors.brand50,
    // box-shadow: inset 0 0 0 1.5px var(--brand-100)
    borderWidth: 1.5,
    borderColor: t.colors.brand100,
  },
  ic: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, gap: 2 },
}));
