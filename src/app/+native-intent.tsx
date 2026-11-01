import { toAppPath } from "@/core/notifications/links";

/**
 * Todo link que abre o app (arp://..., QR, push com link) passa por aqui antes
 * da navegação: os links do ERP viram rotas do app e o resto cai no Início.
 * Não pode lançar erro (derrubaria a abertura do app).
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string | null {
  try {
    const mapped = toAppPath(path);
    // Com o app aberto, link desconhecido não tira o visitante da tela atual.
    if (!initial && mapped === "/" && !isHomeLink(path)) {
      return null;
    }
    return mapped;
  } catch {
    return initial ? "/" : null;
  }
}

/** Link que aponta de propósito para o Início (arp://, arp:///, /). */
function isHomeLink(path: string): boolean {
  return /^(arp:\/{0,3}|\/)?$/i.test(path.trim());
}
