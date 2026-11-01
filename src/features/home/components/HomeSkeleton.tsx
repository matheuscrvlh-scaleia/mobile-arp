import { StyleSheet, useWindowDimensions, View } from "react-native";
import { layout, radii, Skeleton, SkeletonCard } from "@/design";
import { SLIDE_HEIGHT } from "./HighlightSlide";
import { SkeletonGrid } from "./TodaySection";

/** Partes remotas da Início carregando (saudação, busca e atalhos já aparecem de verdade). */
export function HeroSkeleton() {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.hero}>
      <Skeleton width={width - layout.gutter * 2} height={SLIDE_HEIGHT} radius={radii.card} />
      <View style={styles.dots}>
        <Skeleton width={22} height={6} radius={3} />
        <Skeleton width={6} height={6} radius={3} />
        <Skeleton width={6} height={6} radius={3} />
      </View>
    </View>
  );
}

export function MonthCardSkeleton() {
  return <Skeleton width="auto" height={196} radius={radii.cardLg} style={styles.month} />;
}

export function BelowSkeleton() {
  return (
    <View>
      <View style={styles.sectionHead}>
        <Skeleton width={170} height={20} radius={10} />
      </View>
      <View style={styles.hscroll}>
        <SkeletonCard width={236} height={168} radius={radii.xl} />
        <SkeletonCard width={236} height={168} radius={radii.xl} />
      </View>
      <View style={styles.sectionHead}>
        <Skeleton width={130} height={20} radius={10} />
      </View>
      <View style={styles.tabs}>
        <Skeleton width={70} height={18} radius={9} />
        <Skeleton width={60} height={18} radius={9} />
        <Skeleton width={76} height={18} radius={9} />
      </View>
      <SkeletonGrid />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: 18, paddingHorizontal: layout.gutter },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 12 },
  month: { marginTop: 26, marginHorizontal: layout.gutter },
  sectionHead: {
    marginTop: layout.sectionTop,
    marginBottom: layout.sectionBottom,
    marginHorizontal: layout.gutter,
  },
  hscroll: { flexDirection: "row", gap: 12, paddingLeft: layout.gutter, overflow: "hidden" },
  tabs: { flexDirection: "row", gap: 24, paddingHorizontal: layout.gutter, marginBottom: 18 },
});
