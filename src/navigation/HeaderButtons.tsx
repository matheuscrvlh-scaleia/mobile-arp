import { router } from "expo-router";
import { IconButton, type IconButtonVariant } from "@/design";
import { openPath } from "./navigate";

/**
 * Atalho para a Carteira (Trevos, cupons e conquistas), no cabeçalho das
 * telas principais: Início, Explorar, Cupons, Clube e Perfil.
 */
export function WalletButton({ variant = "card" }: { variant?: IconButtonVariant }) {
  return (
    <IconButton
      icon="wallet"
      variant={variant}
      accessibilityLabel="Minha carteira"
      onPress={() => router.push("/carteira")}
    />
  );
}

/** Voltar ao Início a partir de uma aba (Cupons, Clube, Mapa), que não tem pilha para trás. */
export function HomeBackButton({ variant = "card" }: { variant?: IconButtonVariant }) {
  return (
    <IconButton
      icon="chevron-left"
      variant={variant}
      accessibilityLabel="Voltar para o Início"
      onPress={() => openPath("/")}
    />
  );
}
