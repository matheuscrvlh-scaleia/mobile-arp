import { type StyleProp, View, type ViewStyle } from "react-native";
import type { CouponCard } from "@/contracts/app/coupons";
import { createStyles, ProgressBar, Text, useColors } from "@/design";
import {
  type StockCell,
  showsStockGrid,
  stockCells,
  stockColumns,
  stockRows,
  takenCount,
} from "../lib/stock";

type StockGridProps = { stock: CouponCard["stock"]; mine: boolean };

/**
 * Estoque à vista (.stock): um quadrado por unidade, escuro = já pego, verde = o seu.
 * No tema escuro o "já pego" é `inverse` (claro): contraste forte com o livre (`surfaceStrong`)
 * e com o verde do seu, como o `ink` faz no claro.
 * Com muitas unidades (> 60) vira uma barra: a grade teria centenas de Views e
 * quadrados finos demais para ler.
 */
export function StockGrid({ stock, mine }: StockGridProps) {
  const styles = useStyles();
  const colors = useColors();
  const grid = showsStockGrid(stock.total);
  const taken = takenCount(stock);
  const many = stock.total > 15;

  return (
    <View>
      {grid ? (
        <View
          style={[styles.grid, many && styles.gridMany]}
          accessible
          accessibilityLabel={`${taken} de ${stock.total} já pegos`}
        >
          {stockRows(stockCells(stock, mine), stockColumns(stock.total)).map((row, r) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: linhas fixas da grade
            <View key={r} style={[styles.row, many && styles.rowMany]}>
              {row.map((cell, c) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: posição fixa na grade
                <View key={c} style={[styles.cell, many && styles.cellMany, styles[kind(cell)]]} />
              ))}
            </View>
          ))}
        </View>
      ) : (
        <ProgressBar
          value={stock.total > 0 ? taken / stock.total : 0}
          height={14}
          trackColor={colors.surfaceStrong}
          fillColor={colors.inverse}
          accessibilityLabel={`${taken} de ${stock.total} já pegos`}
        />
      )}
      <View style={styles.legend}>
        <LegendItem style={styles.free} label="Disponível" />
        <LegendItem style={styles.taken} label="Já pego" />
        {mine ? <LegendItem style={styles.me} label="O seu" /> : null}
      </View>
    </View>
  );
}

/** Estilo da célula (nome na folha do tema). */
function kind(cell: StockCell | null): "empty" | "taken" | "me" | "free" {
  if (cell === null) return "empty";
  if (cell === "taken") return "taken";
  if (cell === "me") return "me";
  return "free";
}

function LegendItem({ style, label }: { style: StyleProp<ViewStyle>; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, style]} />
      <Text variant="caption" weight={400} tone="textMuted">
        {label}
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
  cellMany: { borderRadius: 4 },
  free: { backgroundColor: t.colors.surfaceStrong },
  taken: { backgroundColor: t.colors.inverse },
  me: { backgroundColor: t.colors.brand },
  empty: { backgroundColor: "transparent" },
  legend: { flexDirection: "row", gap: 14, marginTop: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
}));
