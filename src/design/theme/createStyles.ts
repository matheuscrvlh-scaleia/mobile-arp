import { StyleSheet } from "react-native";
import type { ThemeScheme } from "./palettes";
import { useTheme } from "./ThemeProvider";
import type { Theme } from "./theme";

/** O que o `StyleSheet.create` aceita (estilos nomeados). */
type NamedStyles = Parameters<typeof StyleSheet.create>[0];

/**
 * `StyleSheet.create` com tema. Chame no MÓDULO (como o StyleSheet.create) e use o hook devolvido
 * no componente:
 *
 * ```tsx
 * const useStyles = createStyles((t) => ({
 *   card: { backgroundColor: t.colors.surface, ...t.shadows.lift },
 *   title: { color: t.colors.text },
 * }));
 *
 * function Card() {
 *   const styles = useStyles();
 *   return <View style={styles.card} />;
 * }
 * ```
 *
 * A folha de cada esquema é criada uma vez só, na primeira vez que for pedida, e fica em cache:
 * o hook custa uma leitura de contexto e um acesso a objeto, e devolve sempre a mesma referência
 * enquanto o tema não muda (seguro para o React Compiler, `memo` e itens de lista).
 */
export function createStyles<S extends NamedStyles>(
  factory: (theme: Theme) => S & NamedStyles,
): () => Readonly<S> {
  const cache: Partial<Record<ThemeScheme, Readonly<S>>> = {};
  return function useStyles(): Readonly<S> {
    const theme = useTheme();
    let sheet = cache[theme.scheme];
    if (!sheet) {
      sheet = StyleSheet.create(factory(theme));
      cache[theme.scheme] = sheet;
    }
    return sheet;
  };
}
