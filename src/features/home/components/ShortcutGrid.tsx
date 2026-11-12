import { View } from "react-native";
import {
  createStyles,
  fontFamily,
  Icon,
  type IconName,
  layout,
  motion,
  PressableScale,
  Text,
  useColors,
} from "@/design";
import { STORE_KIND_OPTIONS } from "@/features/stores";
import { openPath } from "@/navigation/navigate";
import { openParkingSheet } from "./ShortcutSheets";

type Variant = "default" | "brand" | "dark";
type Shortcut = {
  icon: IconName;
  label: string;
  variant?: Variant;
  badge?: number;
  onPress: () => void;
};

/**
 * Atalhos da Início (.cats), em linhas de 4: as 3 categorias e Eventos;
 * Cupons, Mapa, Estacionamento e Clube ARP; Circuito Cultural, Sustentarp,
 * Novidades e Nossa História.
 * `couponCount`: cupons no ar (badge; sem a home, sem badge).
 */
export function ShortcutGrid({ couponCount }: { couponCount: number | undefined }) {
  const styles = useStyles();
  const go = (href: string) => () => openPath(href);

  const items: Shortcut[] = [
    ...STORE_KIND_OPTIONS.map((k) => ({
      icon: k.icon,
      label: k.label,
      onPress: go(`/lojas?tipo=${k.value}`),
    })),
    { icon: "calendar-days", label: "Eventos", onPress: go("/agenda") },
    {
      icon: "ticket-percent",
      label: "Cupons",
      variant: "brand",
      badge: couponCount,
      onPress: go("/cupons"),
    },
    { icon: "map", label: "Mapa", onPress: go("/mapa") },
    { icon: "car", label: "Estacionamento", onPress: openParkingSheet },
    { icon: "award", label: "Clube ARP", variant: "dark", onPress: go("/desafios") },
    { icon: "palette", label: "Circuito Cultural", onPress: go("/circuito") },
    { icon: "recycle", label: "Sustentarp", onPress: go("/sustentarp") },
    { icon: "newspaper", label: "Novidades", onPress: go("/novidades") },
    { icon: "landmark", label: "Nossa História", onPress: go("/texto/history_full") },
  ];

  return (
    <View style={styles.grid}>
      {rowsOf(items, 4).map((row) => (
        <View key={row[0]?.label} style={styles.row}>
          {row.map((it) => (
            <ShortcutItem key={it.label} item={it} />
          ))}
          {/* linha incompleta: vagas vazias mantêm a largura dos itens */}
          {Array.from({ length: 4 - row.length }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: vagas sem identidade
            <View key={i} style={styles.item} />
          ))}
        </View>
      ))}
    </View>
  );
}

function rowsOf<T>(list: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size));
  return rows;
}

function ShortcutItem({ item }: { item: Shortcut }) {
  const colors = useColors();
  const styles = useStyles();
  const variant = item.variant ?? "default";
  const badge = item.badge && item.badge > 0 ? item.badge : null;
  return (
    <PressableScale
      scaleTo={motion.pressScale.icon}
      onPress={item.onPress}
      accessibilityLabel={badge ? `${item.label}, ${badge} disponíveis` : item.label}
      style={styles.item}
    >
      <View style={[styles.tile, styles[variant]]}>
        <Icon name={item.icon} size={26} color={ICON[variant](colors)} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText} tone="onMedia" tabular>
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.label} tone="textSecondary" numberOfLines={2}>
        {item.label}
      </Text>
    </PressableScale>
  );
}

/* default: cartão (`surface`, ícone `text`) · brand: verde fixo (ícone `onBrand`) ·
   dark: azulejo escuro fixo (`chrome`, ícone verde), como o .dcard.dark */
const ICON: Record<Variant, (c: ReturnType<typeof useColors>) => string> = {
  default: (c) => c.text,
  brand: (c) => c.onBrand,
  dark: (c) => c.brand,
};

const useStyles = createStyles((t) => ({
  grid: { paddingHorizontal: layout.gutter, marginTop: 24, gap: 16 },
  row: { flexDirection: "row", gap: 8 },
  item: { flex: 1, alignItems: "center", gap: 8 },
  tile: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  default: { backgroundColor: t.colors.surface },
  brand: { backgroundColor: t.colors.brand },
  // no escuro, o fio `chromeBorder` separa o azulejo do fundo (transparente no claro)
  dark: { backgroundColor: t.colors.chrome, boxShadow: `inset 0 0 0 1px ${t.colors.chromeBorder}` },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: t.colors.danger,
    borderWidth: 2.5,
    // aro do recorte: cor do fundo da página
    borderColor: t.colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: fontFamily(750), fontSize: 11, lineHeight: 13 },
  // rótulos longos (Estacionamento, Circuito Cultural) quebram em até 2 linhas
  label: { fontFamily: fontFamily(600), fontSize: 11.5, lineHeight: 14, textAlign: "center" },
}));
