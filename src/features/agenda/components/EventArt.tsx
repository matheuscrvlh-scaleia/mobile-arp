import { type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import type { Tone } from "@/contracts";
import { mediaUrl } from "@/core/api/media";
import { hasIcon, Icon, type IconName, Photo, ToneSurface, useTheme } from "@/design";

type ArtEvent = {
  id: string;
  imageUrl: string | null;
  tone: Tone | null;
  icon: string | null;
  category: { icon: string };
};

/** Ícone do evento sem foto: o do evento, senão o da categoria. */
export function eventIcon(event: Pick<ArtEvent, "icon" | "category">): IconName {
  if (hasIcon(event.icon)) return event.icon;
  if (hasIcon(event.category.icon)) return event.category.icon;
  return "calendar-days";
}

export type EventArtProps = {
  event: ArtEvent;
  /** Largura exibida (pt): escolhe a miniatura da foto (ver `Photo`). */
  displayWidth: number;
  iconSize?: number;
  /** Opacidade do ícone sobre o tom (.ev-hero.tone .big-ic = .3). */
  iconOpacity?: number;
  style?: StyleProp<ViewStyle>;
};

/** Foto do evento ou, sem foto, o tom com o ícone no centro. */
export function EventArt({
  event,
  displayWidth,
  iconSize = 32,
  iconOpacity = 1,
  style,
}: EventArtProps) {
  const { toneOf } = useTheme();
  const src = mediaUrl(event.imageUrl);
  if (src) {
    return (
      <Photo
        source={src}
        displayWidth={displayWidth}
        recyclingKey={`${event.id}:${src}`}
        style={style}
      />
    );
  }
  const spec = toneOf(event.tone);
  return (
    <ToneSurface tone={event.tone} style={[styles.center, style]}>
      <Icon
        name={eventIcon(event)}
        size={iconSize}
        color={spec.fg}
        strokeWidth={iconSize > 64 ? 1.4 : 2}
        style={{ opacity: iconOpacity }}
      />
    </ToneSurface>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
