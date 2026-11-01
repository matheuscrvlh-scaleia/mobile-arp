import { type StyleProp, View, type ViewStyle } from "react-native";
import type { MerchantCouponStats } from "@/contracts/app/merchant";
import { createStyles, Text, withAlpha } from "@/design";
import {
  type StockBreakdown,
  type StockCellKind,
  showsStockGrid,
  stockBreakdown,
  stockCells,
  stockColumns,
  stockRows,
} from "../lib/overview";
import { Panel } from "./Panel";

/**
 * "Os N cupons" (.stock.status): um quadrado por unidade — usado (verde), aguardando (escuro),
 * voltou (laranja claro: venceu sem uso e está livre de novo) e livre. A soma bate com o total.
 * Acima de 60 unidades vira uma barra empilhada (a grade teria centenas de Views).
 */
export function StockPanel({ coupon }: { coupon: MerchantCouponStats }) {
  const styles = useStyles();
  const b = stockBreakdown(coupon);
  const grid = showsStockGrid(b.total);
  const label = `${b.used} usados, ${b.waiting} aguardando, ${b.returned} voltaram e ${b.free} livres, de ${b.total}`;

  return (
    <Panel
      title={`Os ${b.total} cupons`}
      subtitle={
        grid
          ? "Cada quadrado é um cupom. Nunca passa do limite que você definiu."
          : "A barra mostra todos os cupons. Nunca passa do limite que você definiu."
      }
    >
      {b.total === 0 ? null : grid ? (
        <StockGrid breakdown={b} label={label} />
      ) : (
        <StockBar breakdown={b} label={label} />
      )}
      <View style={styles.legend}>
        <LegendItem style={styles.used} label="Usado" count={b.used} />
        <LegendItem style={styles.waiting} label="Aguardando" count={b.waiting} />
        <LegendItem style={styles.returned} label="Voltou" count={b.returned} />
        <LegendItem style={styles.free} label="Livre" count={b.free} />
      </View>
    </Panel>
  );
}

function StockGrid({ breakdown, label }: { breakdown: StockBreakdown; label: string }) {
  const styles = useStyles();
  const many = breakdown.total > 15;
  const rows = stockRows(stockCells(breakdown), stockColumns(breakdown.total));
  return (
    <View style={[styles.grid, many && styles.gridMany]} accessible accessibilityLabel={label}>
      {rows.map((row, r) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: linhas fixas da grade
        <View key={r} style={[styles.row, many && styles.rowMany]}>
          {row.map((cell, c) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: posição fixa na grade
            <Cell key={c} kind={cell} many={many} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Cell({ kind, many }: { kind: StockCellKind | null; many: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.cell, many && styles.cellMany, kind ? styles[kind] : styles.empty]} />
  );
}

const SEGMENTS: readonly StockCellKind[] = ["used", "waiting", "returned", "free"];
const COUNT: Record<StockCellKind, keyof StockBreakdown> = {
  used: "used",
  waiting: "waiting",
  returned: "returned",
  free: "free",
};

function StockBar({ breakdown, label }: { breakdown: StockBreakdown; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.bar} accessible accessibilityRole="image" accessibilityLabel={label}>
      {SEGMENTS.map((kind) => {
        const n = breakdown[COUNT[kind]];
        return n > 0 ? <View key={kind} style={[styles[kind], { flex: n }]} /> : null;
      })}
    </View>
  );
}

function LegendItem({
  style,
  label,
  count,
}: {
  style: StyleProp<ViewStyle>;
  label: string;
  count: number;
}) {
  const styles = useStyles();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, style]} />
      <Text variant="caption" weight={400} tone="textMuted">
        {label}{" "}
        <Text variant="caption" tone="text" tabular>
          {count}
        </Text>
      </Text>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  grid: { gap: 4 },
  gridMany: { gap: 3 },
  row: { flexDirection: "row", gap: 4 },
  rowMany: { gap: 3 },
  cell: { flex: 1, height: 30, borderRadius: 7 },
  cellMany: { height: 22, borderRadius: 5 },
  // .stock.status: u = brand · a = ink (inverse: claro no escuro) · v = laranja claro · livre = sand
  used: { backgroundColor: t.colors.brand },
  waiting: { backgroundColor: t.colors.inverse },
  returned: { backgroundColor: withAlpha(t.colors.danger, t.dark ? 0.55 : 0.45) },
  free: { backgroundColor: t.colors.surfaceStrong },
  empty: { backgroundColor: "transparent" },
  bar: {
    flexDirection: "row",
    height: 22,
    borderRadius: 8,
    overflow: "hidden",
    gap: 2,
    backgroundColor: t.colors.surfaceStrong,
  },
  legend: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 6, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
}));
