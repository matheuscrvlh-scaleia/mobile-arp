import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton, layout, Skeleton, SkeletonText, useColors } from "@/design";
import type { EventRowData } from "../lib/occurrence";
import { EventBody, EventHero, EventTitle, HERO_H } from "./EventHero";

type Props = {
  /** Card do evento já em cache: a capa e o título aparecem na hora. */
  preview: EventRowData | null;
  onBack: () => void;
};

/** Tela do evento carregando (com a prévia do card, se houver). */
export function EventDetailSkeleton({ preview, onBack }: Props) {
  const colors = useColors();
  const { top } = useSafeAreaInsets();
  return (
    <View accessibilityLabel="Carregando evento">
      {preview ? (
        <EventHero event={preview} onBack={onBack} />
      ) : (
        <View style={styles.hero}>
          <Skeleton width="100%" height={HERO_H} radius={0} color={colors.surfaceStrong} />
          <View style={[styles.heroTop, { top: top + layout.navHeadGap }]}>
            <IconButton
              icon="chevron-left"
              variant="white"
              accessibilityLabel="Voltar"
              onPress={onBack}
            />
          </View>
        </View>
      )}
      <EventBody>
        {preview ? (
          <EventTitle>{preview.title}</EventTitle>
        ) : (
          <Skeleton width="70%" height={30} radius={10} />
        )}
        <SkeletonText lines={3} style={styles.desc} />
        <Skeleton height={190} radius={24} style={styles.rules} />
      </EventBody>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: HERO_H, overflow: "hidden" },
  heroTop: {
    position: "absolute",
    left: layout.gutter,
    right: layout.gutter,
    zIndex: 2,
    flexDirection: "row",
  },
  desc: { marginTop: 16 },
  rules: { marginTop: 18 },
});
