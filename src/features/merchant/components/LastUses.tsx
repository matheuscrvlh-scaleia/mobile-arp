import { View } from "react-native";
import type { MerchantOverview, MerchantPeriod } from "@/contracts/app/merchant";
import { createStyles, fontFamily, Text, tracking } from "@/design";
import { useNow } from "@/shared/hooks/useNow";
import { MINUTE_MS } from "@/shared/lib/time";
import { redemptionTime } from "../lib/overview";
import { Panel } from "./Panel";

const EMPTY: Record<MerchantPeriod, string> = {
  today: "Nenhum cupom usado hoje ainda.",
  week: "Nenhum cupom usado nos últimos 7 dias.",
  month: "Nenhum cupom usado nos últimos 30 dias.",
};

/** "Últimos usos" (.last-uses): código mascarado e a hora (com o dia, se não foi hoje). */
export function LastUses({
  items,
  period,
}: {
  items: MerchantOverview["lastRedemptions"];
  period: MerchantPeriod;
}) {
  const styles = useStyles();
  const now = useNow(MINUTE_MS);
  return (
    <Panel title="Últimos usos">
      {items.length === 0 ? (
        <Text variant="small" tone="textMuted" style={styles.empty}>
          {EMPTY[period]}
        </Text>
      ) : (
        <View style={styles.list}>
          {items.map((item, i) => {
            const when = redemptionTime(item.redeemedAt, now);
            return (
              <View
                key={`${item.code}-${item.redeemedAt}`}
                style={[styles.row, i < items.length - 1 && styles.divider]}
                accessible
                accessibilityLabel={`${item.code.replace(/\*+/g, "…")}, usado ${when}`}
              >
                <Text style={styles.code}>{item.code}</Text>
                <Text variant="small" tone="textMuted" tabular>
                  {when}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </Panel>
  );
}

const useStyles = createStyles((t) => ({
  list: { marginTop: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  code: {
    fontFamily: fontFamily(700),
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: tracking(14, 0.06),
    color: t.colors.text,
  },
  empty: { marginTop: 6 },
}));
