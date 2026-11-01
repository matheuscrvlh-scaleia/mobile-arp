import { ScrollView, StyleSheet } from "react-native";
import type { CouponCard } from "@/contracts/app/coupons";
import { layout, SectionHeader } from "@/design";
import { MiniCouponCard } from "@/features/coupons";
import { openPath } from "@/navigation/navigate";

/** .mini-cp 236 + gap 12 */
const SNAP = 248;

/** "Cupons acabando" (.hscroll de MiniCouponCard). Some quando não há cupons. */
export function EndingCoupons({ coupons }: { coupons: readonly CouponCard[] }) {
  if (coupons.length === 0) return null;
  return (
    <>
      <SectionHeader title="Cupons acabando" onAction={() => openPath("/cupons")} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        contentContainerStyle={styles.row}
      >
        {coupons.map((c) => (
          <MiniCouponCard key={c.id} coupon={c} />
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  row: { gap: 12, paddingHorizontal: layout.gutter, paddingBottom: 6 },
});
