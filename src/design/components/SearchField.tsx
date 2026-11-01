import type { ComponentRef, Ref } from "react";
import {
  Pressable,
  type StyleProp,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from "react-native";
import { createStyles } from "../theme/createStyles";
import type { Palette } from "../theme/palettes";
import { useColors } from "../theme/ThemeProvider";
import { fonts, hitSlop, radii, withAlpha } from "../tokens";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

export type SearchFieldProps = Omit<TextInputProps, "style"> & {
  /** Versão escura fixa do mapa (.map-top .search): `chrome` nos dois temas. */
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Mostra o "x" quando há texto; padrão: limpa via onChangeText(""). */
  onClear?: () => void;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

function palette(c: Palette, dark: boolean) {
  return dark
    ? { icon: withAlpha(c.onChrome, 0.6), text: c.onChrome, placeholder: c.onChromeMuted }
    : { icon: c.textMuted, text: c.text, placeholder: c.textMuted };
}

/** Campo de busca (.search): 52 de altura, fundo surface, lupa à esquerda. */
export function SearchField({
  dark = false,
  style,
  onClear,
  value,
  onChangeText,
  placeholder,
  ref,
  ...rest
}: SearchFieldProps) {
  const colors = useColors();
  const styles = useStyles();
  const p = palette(colors, dark);
  const clear = onClear ?? (onChangeText ? () => onChangeText("") : undefined);
  return (
    <View style={[styles.box, dark && styles.dark, style]}>
      <Icon name="search" color={p.icon} />
      <TextInput
        ref={ref}
        {...rest}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={p.placeholder}
        selectionColor={colors.brand}
        returnKeyType={rest.returnKeyType ?? "search"}
        autoCorrect={rest.autoCorrect ?? false}
        accessibilityLabel={rest.accessibilityLabel ?? placeholder}
        style={[styles.input, { color: p.text }]}
      />
      {value && clear ? (
        <Pressable
          onPress={clear}
          hitSlop={hitSlop.md}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
        >
          <Icon name="x" size={18} color={p.icon} />
        </Pressable>
      ) : null}
    </View>
  );
}

export type SearchTriggerProps = {
  label: string;
  onPress: () => void;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Mesma aparência do SearchField, mas é um botão que leva à tela de busca. */
export function SearchTrigger({ label, onPress, dark = false, style }: SearchTriggerProps) {
  const colors = useColors();
  const styles = useStyles();
  const p = palette(colors, dark);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="search"
      style={[styles.box, dark && styles.dark, style]}
    >
      <Icon name="search" color={p.icon} />
      <Text numberOfLines={1} color={p.placeholder} style={styles.triggerText}>
        {label}
      </Text>
    </PressableScale>
  );
}

const useStyles = createStyles((t) => ({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    borderRadius: radii.search,
    backgroundColor: t.colors.surface,
    paddingHorizontal: 18,
  },
  dark: { backgroundColor: t.colors.chrome, ...t.shadows.float },
  input: {
    flex: 1,
    height: "100%",
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingVertical: 0,
  },
  triggerText: { flex: 1 },
}));
