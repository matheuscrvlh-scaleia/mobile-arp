import type { ReactNode } from "react";
import { View } from "react-native";
import { createStyles, Icon, type IconName, PressableScale, Text, useColors } from "@/design";

type Props = {
  icon: IconName;
  label: string;
  /** Texto forte; ou `children` para outro conteúdo (ex.: Switch). */
  value?: string;
  children?: ReactNode;
  /** .info-tile.link: fundo escuro */
  dark?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** Quadro da grade de informações da loja (.info-tile). */
export function InfoTile({
  icon,
  label,
  value,
  children,
  dark = false,
  onPress,
  accessibilityLabel,
}: Props) {
  const c = useColors();
  const styles = useStyles();
  const body = (
    <>
      <Icon name={icon} color={dark ? c.brand : c.brandText} />
      <Text
        variant="caption"
        weight={400}
        tone={dark ? "onChromeMuted" : "textMuted"}
        style={styles.label}
      >
        {label}
      </Text>
      {value ? (
        <Text variant="bodyStrong" weight={700} tone={dark ? "onChrome" : "text"} numberOfLines={2}>
          {value}
        </Text>
      ) : null}
      {children}
    </>
  );
  const style = [styles.tile, dark && styles.dark];
  return onPress ? (
    <PressableScale
      onPress={onPress}
      scaleTo={0.97}
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      {body}
    </PressableScale>
  ) : (
    <View style={style} accessible={!children} accessibilityLabel={accessibilityLabel}>
      {body}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  tile: { flex: 1, backgroundColor: t.colors.surface, borderRadius: 20, padding: 14 },
  // .info-tile.link: chrome (escuro nos dois temas; no escuro ganha o fio claro)
  dark: { backgroundColor: t.colors.chrome, boxShadow: `inset 0 0 0 1px ${t.colors.chromeBorder}` },
  label: { marginTop: 10 },
}));
