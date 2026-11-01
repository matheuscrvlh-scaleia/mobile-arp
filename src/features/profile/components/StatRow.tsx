import { View } from "react-native";
import {
  createStyles,
  fontFamily,
  Icon,
  type IconName,
  layout,
  PressableScale,
  radii,
  Text,
  tracking,
  useColors,
} from "@/design";

export type StatItem = {
  icon: IconName;
  value: string;
  label: string;
  onPress: () => void;
};

/** Três números do visitante (.stat-row / .stat). */
export function StatRow({ items }: { items: StatItem[] }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <PressableScale
          key={item.label}
          onPress={item.onPress}
          scaleTo={0.97}
          accessibilityLabel={`${item.value} ${item.label}`}
          style={styles.stat}
        >
          <Icon name={item.icon} size={19} color={colors.brandText} />
          <Text style={styles.value} tabular numberOfLines={1} adjustsFontSizeToFit>
            {item.value}
          </Text>
          <Text variant="caption" weight={400} tone="textMuted" numberOfLines={1}>
            {item.label}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  row: { flexDirection: "row", gap: 10, paddingHorizontal: layout.gutter, marginTop: 12 },
  stat: { flex: 1, backgroundColor: t.colors.surface, borderRadius: radii.lg, padding: 14 },
  value: {
    fontFamily: fontFamily(800),
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: tracking(24, -0.04),
    color: t.colors.text,
    marginTop: 10,
  },
}));
