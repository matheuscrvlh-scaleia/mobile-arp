import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import type { StoreSummary } from "@/contracts/app/stores";
import { mediaUrl } from "@/core/api/media";
import {
  createStyles,
  DashedDivider,
  hitSlop,
  Icon,
  motion,
  Photo,
  PressableScale,
  radii,
  Skeleton,
  Text,
  useColors,
} from "@/design";
import { useToggleFavorite } from "../api/favorites";
import { storeLocation } from "../lib/location";

/** Foto redonda do cartão (pt). */
const PHOTO_SIZE = 50;

export type StoreCardProps = { store: StoreSummary; dark?: boolean };

/** Cartão de loja da grade (.dcard): foto, selo de cupom, nome, local e favoritar no rodapé. */
export function StoreCard({ store, dark = false }: StoreCardProps) {
  const c = useColors();
  const styles = useStyles();
  const router = useRouter();
  const toggleFavorite = useToggleFavorite();
  const fav = store.isFavorite;
  const hasCoupon = store.activeCouponsCount > 0;
  const where = `${store.category.name} · ${storeLocation(store, { short: true })}`;
  const muted = dark ? c.onChromeMuted : c.textMuted;

  return (
    <PressableScale
      scaleTo={motion.pressScale.card}
      onPress={() => router.push(`/loja/${store.slug}`)}
      accessibilityLabel={`${store.name}, ${where}, ${store.isOpenNow ? "aberta agora" : "fechada agora"}${hasCoupon ? ", tem cupom" : ""}${fav ? ", favorita" : ""}`}
      // o cartão inteiro é um elemento só para o leitor de tela: favoritar vira ação dele
      accessibilityActions={[
        { name: "favorite", label: fav ? "Remover dos favoritos" : "Favoritar" },
      ]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === "favorite") toggleFavorite(store);
      }}
      style={[styles.card, dark && styles.dark]}
    >
      <View style={styles.top}>
        <View>
          <Photo
            source={mediaUrl(store.coverImageUrl)}
            recyclingKey={store.id}
            displayWidth={PHOTO_SIZE}
            fallbackIcon={store.icon}
            style={[styles.photo, dark ? styles.photoDark : styles.photoLight]}
          />
          <View
            style={[
              styles.status,
              store.isOpenNow ? styles.statusOpen : styles.statusClosed,
              { borderColor: dark ? c.chrome : c.surface },
            ]}
          />
        </View>
        {hasCoupon ? (
          <View style={styles.flag}>
            <Icon name="percent" size={15} color={c.onMedia} />
          </View>
        ) : (
          <Icon name="arrow-up-right" size={17} color={dark ? c.onChromeSubtle : c.textMuted} />
        )}
      </View>
      <Text variant="h4" tone={dark ? "onChrome" : "text"} numberOfLines={2} style={styles.name}>
        {store.name}
      </Text>
      <Text variant="small" color={muted} numberOfLines={2}>
        {where}
      </Text>
      <View style={styles.spacer} />
      <DashedDivider light={dark} spacing={0} style={styles.dashed} />
      <View style={styles.foot}>
        <Text variant="smallStrong" weight={650} tone={dark ? "onChrome" : "text"}>
          {fav ? "Favorita" : "Favoritar"}
        </Text>
        <Pressable
          onPress={() => toggleFavorite(store)}
          hitSlop={hitSlop.md}
          accessibilityRole="switch"
          accessibilityLabel="Favoritar"
          accessibilityState={{ checked: fav }}
        >
          <Icon name="heart" color={fav ? c.danger : muted} fill={fav ? c.danger : undefined} />
        </Pressable>
      </View>
    </PressableScale>
  );
}

/** Cartão carregando, do mesmo tamanho. */
export function StoreCardSkeleton() {
  const c = useColors();
  const styles = useStyles();
  return (
    <View style={[styles.card, styles.skeleton]}>
      <Skeleton
        width={PHOTO_SIZE}
        height={PHOTO_SIZE}
        radius={PHOTO_SIZE / 2}
        color={c.surfaceStrong}
      />
      <Skeleton width="80%" height={16} color={c.surfaceStrong} style={styles.name} />
      <Skeleton width="60%" height={12} color={c.surfaceStrong} />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  card: {
    minHeight: 196,
    padding: 16,
    borderRadius: radii.card,
    backgroundColor: t.colors.surface,
  },
  dark: { backgroundColor: t.colors.chrome, ...t.shadows.cardDark },
  skeleton: { gap: 6 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  photo: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: PHOTO_SIZE / 2 },
  photoLight: t.shadows.photoRing,
  photoDark: t.shadows.photoRingDark,
  // aberto/fechado discreto, no canto da foto
  status: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  statusOpen: { backgroundColor: t.colors.brand },
  statusClosed: { backgroundColor: t.colors.textSubtle },
  flag: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: t.colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { marginTop: 18, marginBottom: 2 },
  spacer: { flex: 1 },
  dashed: { marginTop: 14, marginBottom: 12 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
}));
