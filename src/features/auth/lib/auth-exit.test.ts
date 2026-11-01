import { describe, expect, it } from "@jest/globals";
import { authExit } from "./auth-exit";

describe("authExit", () => {
  it("volta para a tela de origem tirando só as telas de conta", () => {
    expect(authExit(["(tabs)", "cupom/[id]", "cadastro"])).toEqual({ kind: "dismiss", count: 1 });
    expect(authExit(["(tabs)", "cupom/[id]", "cadastro", "entrar"])).toEqual({
      kind: "dismiss",
      count: 2,
    });
  });

  it("veio do leitor de QR (tela da pilha raiz): volta ao leitor", () => {
    expect(authExit(["(tabs)", "ler-qr", "cadastro"])).toEqual({ kind: "dismiss", count: 1 });
    // cadastro → "Já tenho conta" troca a tela (replace): continua uma só
    expect(authExit(["(tabs)", "ler-qr", "entrar"])).toEqual({ kind: "dismiss", count: 1 });
    // link de selo abrindo o app frio, sem as abas embaixo
    expect(authExit(["selo/[token]", "entrar"])).toEqual({ kind: "dismiss", count: 1 });
  });

  it("nova senha: sai junto com o esqueci e o entrar", () => {
    expect(authExit(["(tabs)", "cupom/[id]", "entrar", "senha/esqueci", "senha/nova"])).toEqual({
      kind: "dismiss",
      count: 3,
    });
    expect(authExit(["boas-vindas", "entrar", "senha/esqueci", "senha/nova"])).toEqual({
      kind: "home",
    });
  });

  it("vai para o Início quando só há telas de conta (boas-vindas ou link direto)", () => {
    expect(authExit(["boas-vindas", "cadastro"])).toEqual({ kind: "home" });
    expect(authExit(["boas-vindas", "cadastro", "entrar"])).toEqual({ kind: "home" });
    expect(authExit(["entrar"])).toEqual({ kind: "home" });
    expect(authExit([])).toEqual({ kind: "home" });
  });

  it("sem tela de conta no topo, vai para o Início", () => {
    expect(authExit(["(tabs)", "perfil"])).toEqual({ kind: "home" });
  });
});
