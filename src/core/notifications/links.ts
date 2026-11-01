/*
 * Converte links que chegam de fora (push do ERP, QR, link compartilhado,
 * lembrete local) no caminho de uma rota do app. Puro: usado pelo
 * +native-intent e pelo toque em notificação.
 *
 *   arp://cupom/abc            → /cupom/abc
 *   arp://mapa?loja=x&andar=2  → /mapa?loja=x&andar=2
 *   /carteira/abc (lembrete)   → /carteira/abc
 *   qualquer outra coisa       → /
 */

/** Rotas com um parâmetro (`/<nome>/<id ou slug>`). */
const WITH_PARAM = new Set(["loja", "cupom", "evento", "selo", "carteira"]);

/** Rotas sem parâmetro aceitas de fora. A query é mantida (ex.: mapa?loja=, lojas?tipo=). */
const STATIC = new Set([
  "desafios",
  "cupons",
  "mapa",
  "agenda",
  "carteira",
  "lojas",
  "perfil",
  "favoritos",
  "busca",
  "conta",
]);

/** id, slug ou token: nada que mude o caminho (barras, espaços, sinais de HTML). */
const PARAM = /^[A-Za-z0-9._~%-]{1,200}$/;

/** Rotas cujo parâmetro é sempre um id (UUID): outra coisa daria 400 na API. */
const UUID_PARAM = new Set(["cupom", "evento", "carteira"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SCHEME = /^([a-z][a-z0-9+.-]*):(\/\/)?/i;

/** Parte do link que vem depois do esquema, já sem o host quando ele não faz parte da rota. */
function stripScheme(url: string): string {
  const match = SCHEME.exec(url);
  if (!match) return url;
  const scheme = (match[1] ?? "").toLowerCase();
  const rest = url.slice(match[0].length);
  // Expo Go / dev: exp://192.168.0.2:8081/--/loja/x
  const dev = rest.indexOf("/--/");
  if (dev >= 0) return rest.slice(dev + 3);
  // arp://loja/x: o "host" já é a primeira parte da rota.
  if (scheme === "arp") return rest;
  // https://dominio/loja/x, exp://host:8081: descarta o host.
  const slash = rest.search(/[/?#]/);
  return slash >= 0 && rest[slash] === "/" ? rest.slice(slash) : "";
}

export function toAppPath(url: string | null | undefined): string {
  const raw = (url ?? "").trim();
  if (!raw) return "/";

  const withoutHash = stripScheme(raw).split("#")[0] ?? "";
  const q = withoutHash.indexOf("?");
  const pathname = q >= 0 ? withoutHash.slice(0, q) : withoutHash;
  const search = q >= 0 && q < withoutHash.length - 1 ? withoutHash.slice(q) : "";

  const [head, param, ...extra] = pathname.split("/").filter(Boolean);
  if (!head || extra.length > 0) return "/";
  const name = head.toLowerCase();

  if (param === undefined) return STATIC.has(name) ? `/${name}${search}` : "/";
  if (!WITH_PARAM.has(name) || !PARAM.test(param)) return "/";
  if (UUID_PARAM.has(name) && !UUID.test(param)) return "/";
  return `/${name}/${param}`;
}

/** Link web (push com promoção num site): abre no navegador quando não é rota do app. */
export function isWebUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && /^https?:\/\//i.test(url.trim());
}
