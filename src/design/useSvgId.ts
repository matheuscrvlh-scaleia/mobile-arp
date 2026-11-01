import { useId } from "react";

/**
 * Id único e válido para referências internas de um SVG (`url(#id)` de gradientes, máscaras).
 * O `useId` do React traz `:` e outros caracteres que o react-native-svg não aceita em `url()`.
 */
export function useSvgId(prefix?: string): string {
  const id = useId();
  return `${prefix ?? "svg"}${id.replace(/[^a-zA-Z0-9]/g, "")}`;
}
