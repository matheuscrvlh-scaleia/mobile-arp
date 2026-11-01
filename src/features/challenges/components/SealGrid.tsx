import { useWindowDimensions, View } from "react-native";
import type { ChallengeItem } from "@/contracts/app/challenges";
import { createStyles, layout, SealBadge, Text } from "@/design";

export type SealGridProps = {
  challenges: readonly ChallengeItem[];
  signedIn: boolean;
};

const COLS = 3;
const GAP = 10;

/** "Sua coleção" (.seals): um selo por desafio, cinza com cadeado até ganhar. */
export function SealGrid({ challenges, signedIn }: SealGridProps) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const cell = Math.floor((width - layout.gutter * 2 - GAP * (COLS - 1)) / COLS);
  return (
    <View style={styles.grid}>
      {challenges.map((c) => {
        const earned = signedIn && c.earned;
        return (
          <View key={c.id} style={[styles.seal, { width: cell }]}>
            <SealBadge seal={c.seal} size={64} locked={!earned} />
            <Text
              variant="smallStrong"
              weight={650}
              align="center"
              numberOfLines={2}
              tone={earned ? "text" : "textMuted"}
            >
              {c.seal.name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
    paddingHorizontal: layout.gutter,
  },
  seal: {
    backgroundColor: t.colors.surface,
    borderRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 8,
    paddingBottom: 12,
    alignItems: "center",
    gap: 10,
  },
}));
