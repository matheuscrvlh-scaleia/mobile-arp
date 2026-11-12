import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Keyframe } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createStyles,
  easings,
  fontFamily,
  IconButton,
  layout,
  ScreenContainer,
  SearchField,
  Spinner,
  Text,
  tracking,
  useColors,
  useTabBarInset,
  useTheme,
} from "@/design";
import { useStore } from "@/features/stores";
import { HomeBackButton } from "@/navigation/HeaderButtons";
import { plural } from "@/shared/lib/format";
import { queryView } from "@/shared/query/query-view";
import { useMapData, useMapStores } from "../api/map";
import { FloorLayer } from "../components/FloorLayer";
import { FloorPicker } from "../components/FloorPicker";
import { MapSheet } from "../components/MapSheet";
import { type MapFocus, MapViewport } from "../components/MapViewport";
import { PinsLayer } from "../components/PinsLayer";
import { mapColors } from "../lib/map-colors";
import {
  defaultFloor,
  findPin,
  type MapCategory,
  type MapPin,
  sortFloorsDesc,
} from "../lib/map-geometry";

/** Altura do painel acima da barra de abas (o resto da tela é do mapa). */
const SHEET_BODY = 190;
/** O painel sobe por cima do mapa (raio de 32). */
const SHEET_OVERLAP = 30;

// @keyframes floorin: opacidade 0, scale(.9) translateY(14px) → normal, .55s com mola
const floorIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.9 }, { translateY: 14 }] },
  100: { opacity: 1, transform: [{ scale: 1 }, { translateY: 0 }], easing: easings.spring },
}).duration(550);

/** Mapa (aba /mapa; ?loja=<slug|id> seleciona a loja, ?andar=<floorId> abre o andar). */
export default function MapScreen() {
  const c = useColors();
  const { scheme } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  // setParams desta rota (o `router.setParams` global mexe na tela que estiver em foco)
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ loja?: string; andar?: string }>();
  const { top } = useSafeAreaInsets();
  const { clearance } = useTabBarInset();
  const map = useMapData();
  const mapView = queryView(map);
  const stores = useMapStores();

  const [floorId, setFloorId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<MapCategory>("all");
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const floors = map.data?.floors ?? [];
  const floor = floors.find((f) => f.id === floorId) ?? defaultFloor(floors);
  const selected = floors.flatMap((f) => f.pins).find((p) => p.storeId === selectedId) ?? null;
  const detail = useStore(selected?.slug);
  const selectedStore = detail.data ?? (selected ? stores.data?.get(selected.storeId) : undefined);

  // Links (arp://mapa?loja=…&andar=…) chegam com a aba já montada: aplica UMA vez por
  // valor (refetch do mapa não reaplica seleção/zoom) e limpa os parâmetros, para o
  // mesmo link funcionar de novo depois.
  const { loja, andar } = params;
  const data = map.data;
  const applied = useRef<string | null>(null);
  useEffect(() => {
    if (!loja && !andar) {
      applied.current = null;
      return;
    }
    const link = `${loja ?? ""}|${andar ?? ""}`;
    if (!data || applied.current === link) return;
    applied.current = link;
    const hit = loja ? findPin(data, loja) : undefined;
    if (hit) {
      setFloorId(hit.floor.id);
      setSelectedId(hit.pin.storeId);
      setCategory("all");
      setQ("");
      setFocus({ x: hit.pin.x, y: hit.pin.y, key: Date.now() });
    } else if (andar && data.floors.some((f) => f.id === andar)) {
      setFloorId(andar);
      setSelectedId(null);
      setResetKey((k) => k + 1);
    }
    navigation.setParams({ loja: undefined, andar: undefined } as never);
  }, [data, loja, andar, navigation]);

  const changeFloor = (id: string) => {
    setFloorId(id);
    setSelectedId(null);
    setFocus(null);
    setResetKey((k) => k + 1);
  };

  /** Toque no pino (alterna) ou na lista (vai até a loja, inclusive em outro andar). */
  const select = (pin: MapPin, pinFloorId: string, fromList: boolean) => {
    const otherFloor = pinFloorId !== floor?.id;
    if (otherFloor) {
      setFloorId(pinFloorId);
      setQ("");
      setResetKey((k) => k + 1);
    }
    const next = selectedId === pin.storeId && !otherFloor ? null : pin.storeId;
    setSelectedId(next);
    if (next && (fromList || otherFloor)) setFocus({ x: pin.x, y: pin.y, key: Date.now() });
  };

  const center = () => {
    setSelectedId(null);
    setFocus(null);
    setResetKey((k) => k + 1);
  };

  const sheetHeight = SHEET_BODY + clearance;
  const ground = floor?.level === 0;

  return (
    <ScreenContainer top="none" background={mapColors[scheme].bg}>
      <MapViewport
        insetTop={top + 118}
        resetKey={`${floor?.id ?? ""}-${resetKey}`}
        focus={focus}
        style={[styles.viewport, { bottom: sheetHeight - SHEET_OVERLAP }]}
      >
        {(canvas) =>
          floor ? (
            <Animated.View key={floor.id} entering={floorIn} style={StyleSheet.absoluteFill}>
              <FloorLayer floor={floor} canvas={canvas} ground={ground} />
              <PinsLayer
                floor={floor}
                canvas={canvas}
                ground={ground}
                selectedId={selectedId}
                category={category}
                q={q}
                onPinPress={(pin) => select(pin, floor.id, false)}
              />
            </Animated.View>
          ) : null
        }
      </MapViewport>

      {mapView === "loading" ? (
        <View style={[styles.loading, { bottom: sheetHeight }]} pointerEvents="none">
          <Spinner color={c.textMuted} />
        </View>
      ) : null}

      <View style={[styles.top, { top: top + 6 }]}>
        <HomeBackButton variant="white" />
        <SearchField
          dark
          value={q}
          onChangeText={(t) => {
            setQ(t);
            setSelectedId(null);
          }}
          placeholder="Buscar loja no mapa"
          autoCapitalize="none"
          style={styles.search}
        />
        <IconButton
          icon="locate-fixed"
          variant="white"
          accessibilityLabel="Centralizar"
          onPress={center}
        />
      </View>

      {floor ? (
        <View style={[styles.floorLabel, { top: top + 70 }]} pointerEvents="none">
          <Text style={styles.floorName} accessibilityRole="header">
            {floor.label}
          </Text>
          <Text variant="caption" tone="textMuted">
            {plural(floor.pins.length, "lugar", "lugares")} neste andar
          </Text>
        </View>
      ) : null}

      {floors.length > 1 && floor ? (
        <View style={[styles.floors, { top: top + 70 }]}>
          <FloorPicker floors={sortFloorsDesc(floors)} value={floor.id} onChange={changeFloor} />
        </View>
      ) : null}

      <View style={[styles.sheet, { height: sheetHeight }]}>
        <MapSheet
          floor={floor}
          floors={floors}
          selected={selected}
          selectedStore={selectedStore}
          stores={stores.data}
          category={category}
          q={q}
          view={mapView}
          error={map.error}
          retrying={map.isFetching}
          onRetry={() => void map.refetch()}
          onCategory={(c) => {
            setCategory(c);
            setSelectedId(null);
          }}
          onSelect={(pin, id) => select(pin, id, true)}
          onOpenStore={(slug) => router.push(`/loja/${slug}`)}
        />
      </View>
    </ScreenContainer>
  );
}

const useStyles = createStyles((t) => ({
  viewport: { position: "absolute", left: 0, right: 0, top: 0 },
  loading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  top: {
    position: "absolute",
    left: layout.gutter,
    right: layout.gutter,
    flexDirection: "row",
    gap: 10,
    zIndex: 5,
  },
  search: { flex: 1 },
  floorLabel: { position: "absolute", left: layout.gutter, zIndex: 4 },
  floorName: {
    fontFamily: fontFamily(850),
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: tracking(30, -0.04),
    color: t.colors.text,
  },
  floors: { position: "absolute", right: 16, zIndex: 5 },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 6 },
}));
