/*
 * Para onde voltar depois de entrar ou cadastrar. As telas de conta podem
 * estar empilhadas (convite → cadastro → entrar); todas saem juntas e o
 * visitante volta à tela em que estava. Se não houver nada antes delas (veio
 * da boas-vindas ou de um link direto), vai para o Início. A recuperação de
 * senha (entrar → senha/esqueci → senha/nova) também é tela de conta.
 */

const AUTH_ROUTES = new Set(["entrar", "cadastro", "boas-vindas", "senha/esqueci", "senha/nova"]);

export type AuthExit = { kind: "dismiss"; count: number } | { kind: "home" };

/** `routeNames` = rotas da pilha raiz, da base para o topo. */
export function authExit(routeNames: readonly string[]): AuthExit {
  let count = 0;
  for (let i = routeNames.length - 1; i >= 0; i--) {
    if (!AUTH_ROUTES.has(routeNames[i] ?? "")) break;
    count++;
  }
  if (count === 0 || count >= routeNames.length) return { kind: "home" };
  return { kind: "dismiss", count };
}
