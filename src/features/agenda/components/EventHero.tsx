import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createStyles,
  fontFamily,
  IconButton,
  layout,
  Pill,
  Text,
  tracking,
  useColors,
  withAlpha,
} from "@/design";
import { type EventRowData, longEventLabel } from "../lib/occurrence";
import { EventArt } from "./EventArt";

export const HERO_H = 360;

/** Véu `scrim` em cima (botões) e embaixo (pills). */
const SHADE = {
  alphas: [0.35, 0, 0.55] as const,
  locations: [0, 0.35, 1] as const,
};

type HeroProps = {
  /** Detalhe ou a prévia em cache (card da Início ou item da agenda). */
  event: EventRowData;
  ended?: boolean;
  onBack: () => void;
  onShare?: () => void;
};

/** Capa (.ev-hero): foto ou tom com ícone grande, botões glass e pills. */
export function EventHero({ event, ended = false, onBack, onShare }: HeroProps) {
  const colors = useColors();
  const styles = useStyles();
  const { top } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <View style={styles.hero}>
      <EventArt
        event={event}
        displayWidth={width}
        iconSize={140}
        iconOpacity={0.3}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[
          withAlpha(colors.scrim, SHADE.alphas[0]),
          withAlpha(colors.scrim, SHADE.alphas[1]),
          withAlpha(colors.scrim, SHADE.alphas[2]),
        ]}
        locations={SHADE.locations}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[styles.heroTop, { top: top + layout.navHeadGap }]}>
        <IconButton
          icon="chevron-left"
          variant="glass"
          accessibilityLabel="Voltar"
          onPress={onBack}
        />
        {onShare ? (
          <IconButton
            icon="share-2"
            variant="glass"
            accessibilityLabel="Compartilhar evento"
            onPress={onShare}
          />
        ) : null}
      </View>
      <View style={styles.tags}>
        <Pill label={event.category.name} variant="glass" />
        {event.isLongRunning ? (
          <Pill label={longEventLabel(event)} icon="repeat" variant="glass" />
        ) : null}
        {event.awardsSeal ? <Pill label="Vale selo" icon="award" variant="brand" /> : null}
        {ended ? <Pill label="Encerrado" icon="clock" variant="dark" /> : null}
      </View>
    </View>
  );
}

/** Corpo (fundo da página) que sobe sobre a capa. */
export function EventBody({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.body}>{children}</View>;
}

export function EventTitle({ children }: { children: string }) {
  const styles = useStyles();
  return (
    <Text style={styles.h1} accessibilityRole="header">
      {children}
    </Text>
  );
}

const useStyles = createStyles((t) => ({
  hero: { height: HERO_H, overflow: "hidden", backgroundColor: t.colors.chrome },
  heroTop: {
    position: "absolute",
    left: layout.gutter,
    right: layout.gutter,
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tags: {
    position: "absolute",
    left: layout.gutter,
    right: layout.gutter,
    bottom: 42,
    zIndex: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  body: {
    backgroundColor: t.colors.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -26,
    paddingTop: 22,
    paddingHorizontal: layout.gutter,
  },
  h1: {
    fontFamily: fontFamily(800),
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: tracking(30, -0.04),
    color: t.colors.text,
  },
}));
