import { type Href, router } from "expo-router";

/*
 * Navegação a partir de qualquer lugar (telas, sheets, notificações).
 * Abas (/, /cupons, /desafios, /mapa) vivem dentro de (tabs): `push`/`replace`
 * para elas a partir de uma tela da pilha criaria uma SEGUNDA barra de abas.
 * `dismissTo` volta às abas existentes (e cai num replace quando não há).
 */

const TAB_PATHS = new Set(["/", "/cupons", "/desafios", "/mapa"]);

function pathnameOf(href: string): string {
  const end = href.search(/[?#]/);
  return end >= 0 ? href.slice(0, end) || "/" : href;
}

export const isTabPath = (href: string): boolean => TAB_PATHS.has(pathnameOf(href));

/** Abre um caminho do app: aba → volta às abas; tela → empilha. */
export function openPath(href: string): void {
  if (isTabPath(href)) router.dismissTo(href as Href);
  else router.push(href as Href);
}

/** Voltar, ou ir para `fallback` quando a tela foi aberta direto (link, push). */
export function goBackOr(fallback = "/"): void {
  if (router.canGoBack()) router.back();
  else if (isTabPath(fallback)) router.dismissTo(fallback as Href);
  else router.replace(fallback as Href);
}
