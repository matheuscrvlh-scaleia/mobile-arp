import { useRouter } from "expo-router";
import { View } from "react-native";
import type { StoreRef } from "@/contracts/app/coupons";
import type { StoreDetail } from "@/contracts/app/stores";
import { mediaUrl } from "@/core/api/media";
import { createStyles, Icon, Photo, PressableScale, radii, Text, useColors } from "@/design";
import { formatHoursToday, storeLocation } from "@/features/stores";

type StoreRowProps = { store: StoreRef; detail?: StoreDetail };

/** Logo da loja (pt). */
const MONO = 46;

/** Linha da loja (.store-row) que leva à página dela. */
export function StoreRow({ store, detail }: StoreRowProps) {
  const router = useRouter();
  const styles = useStyles();
  const colors = useColors();
  const photo = mediaUrl(detail?.logoUrl ?? detail?.coverImageUrl);
  const info = detail
    ? `${storeLocation(detail)} · ${formatHoursToday(detail.hours, new Date())}`
    : "Ver a página da loja";

  return (
    <PressableScale
      scaleTo={0.98}
      onPress={() => router.push(`/loja/${store.slug}`)}
      accessibilityLabel={`${store.name}. ${info}`}
      style={styles.row}
    >
      {photo ? (
        <Photo source={photo} displayWidth={MONO} style={styles.mono} />
      ) : (
        <View style={[styles.mono, { backgroundColor: store.brandColor }]}>
          <Icon name={store.icon} color={colors.onMedia} />
        </View>
      )}
      <View style={styles.texts}>
        <Text variant="bodyStrong" weight={700} numberOfLines={1}>
          {store.name}
        </Text>
        <Text variant="small" tone="textMuted" numberOfLines={1}>
          {info}
        </Text>
      </View>
      <View style={styles.go}>
        <Icon name="chevron-right" size={18} />
      </View>
    </PressableScale>
  );
}

const useStyles = createStyles((t) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: t.colors.surface,
    marginTop: 14,
  },
  mono: {
    width: MONO,
    height: MONO,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...t.shadows.hairline,
  },
  texts: { flex: 1, minWidth: 0 },
  go: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
}));
