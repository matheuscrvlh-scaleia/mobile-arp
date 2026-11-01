import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { StoreDetail } from "@/contracts/app/stores";
import { mediaUrl } from "@/core/api/media";
import {
  createStyles,
  Icon,
  IconButton,
  layout,
  Photo,
  PressableScale,
  useColors,
  useTopInset,
  withAlpha,
} from "@/design";

export const COVER_HEIGHT = 290;
/** Placa da logo (quadrada). */
const LOGO_SIZE = 76;
/** Coração ligado sobre a capa (vermelho claro, legível sobre qualquer foto): fica sobre mídia,
    igual nos dois temas, como o `onMedia`. */
const HEART_ON_COVER = "#ff8a8a";

type Props = {
  store: StoreDetail;
  onBack: () => void;
  onShare: () => void;
  onFavorite: () => void;
};

/** Capa da loja (.st-cover): cor da marca, foto com zoom lento, sombra em degradê e logo. */
export function StoreCover({ store, onBack, onShare, onFavorite }: Props) {
  const c = useColors();
  const styles = useStyles();
  const top = useTopInset("header");
  // a capa ocupa a largura da tela
  const { width } = useWindowDimensions();
  const zoom = useSharedValue(1.12);
  useEffect(() => {
    // @keyframes kb: scale(1.12) → 1 em 14s
    zoom.set(withTiming(1, { duration: 14_000, easing: Easing.out(Easing.quad) }));
  }, [zoom]);
  const kb = useAnimatedStyle(() => ({ transform: [{ scale: zoom.get() }] }));
  const cover = mediaUrl(store.coverImageUrl);
  const logo = mediaUrl(store.logoUrl);

  return (
    <View style={[styles.cover, { backgroundColor: store.brandColor }]}>
      {cover ? (
        <Animated.View style={[StyleSheet.absoluteFill, kb]}>
          <Photo
            source={cover}
            displayWidth={width}
            style={[StyleSheet.absoluteFill, styles.transparent]}
          />
        </Animated.View>
      ) : null}
      <LinearGradient
        colors={[withAlpha(c.scrim, 0.4), withAlpha(c.scrim, 0), withAlpha(store.brandColor, 0.94)]}
        locations={[0, 0.38, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.top, { paddingTop: top }]}>
        <IconButton
          icon="chevron-left"
          variant="glass"
          accessibilityLabel="Voltar"
          onPress={onBack}
        />
        <View style={styles.actions}>
          <IconButton
            icon="share-2"
            variant="glass"
            accessibilityLabel="Compartilhar loja"
            onPress={onShare}
          />
          <PressableScale
            onPress={onFavorite}
            scaleTo={0.92}
            accessibilityRole="switch"
            accessibilityLabel="Favoritar"
            accessibilityState={{ checked: store.isFavorite }}
            style={styles.glass}
          >
            {Platform.OS === "ios" ? (
              <BlurView intensity={24} tint="light" style={StyleSheet.absoluteFill} />
            ) : null}
            <Icon
              name="heart"
              color={store.isFavorite ? HEART_ON_COVER : c.onMedia}
              fill={store.isFavorite ? HEART_ON_COVER : undefined}
            />
          </PressableScale>
        </View>
      </View>
      <View style={styles.logo}>
        {logo ? (
          <Photo
            source={logo}
            displayWidth={LOGO_SIZE}
            style={styles.logoImg}
            contentFit="contain"
          />
        ) : (
          <Icon name={store.icon} size={34} color={store.brandColor} />
        )}
      </View>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  cover: { height: COVER_HEIGHT, overflow: "hidden" },
  transparent: { backgroundColor: "transparent" },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: layout.gutter,
  },
  actions: { flexDirection: "row", gap: 10 },
  glass: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: t.colors.glass,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    position: "absolute",
    left: layout.gutter,
    bottom: 44,
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 26,
    // placa da logo: branca nos dois temas (logos são feitas para fundo claro)
    backgroundColor: t.colors.paper,
    alignItems: "center",
    justifyContent: "center",
    ...t.shadows.lift,
  },
  logoImg: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 26,
    backgroundColor: t.colors.paper,
  },
}));
