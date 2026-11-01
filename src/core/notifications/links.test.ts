import { describe, expect, it } from "@jest/globals";
import { isWebUrl, toAppPath } from "./links";

const ID = "01a1947b-e4a7-7cb6-9b93-7fcbb185b1b8";

describe("toAppPath", () => {
  it.each([
    ["arp://loja/cafe-da-praca", "/loja/cafe-da-praca"],
    [`arp://cupom/${ID}`, `/cupom/${ID}`],
    [`arp://evento/${ID}`, `/evento/${ID}`],
    ["arp://selo/tok_9Xy-z", "/selo/tok_9Xy-z"],
    ["arp://desafios", "/desafios"],
    ["arp://cupons", "/cupons"],
    ["arp://mapa", "/mapa"],
    ["arp://agenda", "/agenda"],
    ["arp://carteira", "/carteira"],
  ])("deep link do ERP %s → %s", (url, path) => {
    expect(toAppPath(url)).toBe(path);
  });

  it("mantém a query das rotas sem parâmetro", () => {
    expect(toAppPath("arp://mapa?loja=cafe&andar=2")).toBe("/mapa?loja=cafe&andar=2");
    expect(toAppPath("/lojas?tipo=food")).toBe("/lojas?tipo=food");
  });

  it("descarta query e hash das rotas com parâmetro", () => {
    expect(toAppPath(`arp://cupom/${ID}?utm=push#x`)).toBe(`/cupom/${ID}`);
  });

  it("aceita caminhos internos (lembretes locais)", () => {
    expect(toAppPath(`/carteira/${ID}`)).toBe(`/carteira/${ID}`);
    expect(toAppPath(`/evento/${ID}`)).toBe(`/evento/${ID}`);
    expect(toAppPath(`cupom/${ID}`)).toBe(`/cupom/${ID}`);
    expect(toAppPath("/perfil")).toBe("/perfil");
  });

  it("tolera barra no fim, barra tripla e maiúsculas no nome da rota", () => {
    expect(toAppPath("arp://loja/cafe/")).toBe("/loja/cafe");
    expect(toAppPath("arp:///loja/cafe")).toBe("/loja/cafe");
    expect(toAppPath("ARP://Desafios")).toBe("/desafios");
  });

  it("entende links do Expo Go e de domínio web", () => {
    expect(toAppPath(`exp://192.168.0.2:8081/--/cupom/${ID}`)).toBe(`/cupom/${ID}`);
    expect(toAppPath("exp://192.168.0.2:8081")).toBe("/");
    expect(toAppPath("https://arp.com.br/loja/cafe")).toBe("/loja/cafe");
  });

  it.each([
    [""],
    ["   "],
    ["arp://"],
    ["/"],
    ["arp://desconhecido"],
    ["arp://loja"],
    ["arp://desafios/extra"],
    ["arp://loja/a/b"],
    ["arp://loja/<script>"],
    ["arp://cupom/a b"],
    ["arp://boas-vindas"],
    // id que não é UUID daria 400 na API
    ["arp://cupom/abc"],
    ["arp://evento/123"],
    ["/carteira/x"],
    ["exp+arp-visitante://expo-development-client/?url=http%3A%2F%2F10.0.0.2%3A8081"],
  ])("desconhecido ou inválido %j → /", (url) => {
    expect(toAppPath(url)).toBe("/");
  });

  it("reconhece links web (abrem no navegador)", () => {
    expect(isWebUrl("https://arp.com.br/promo")).toBe(true);
    expect(isWebUrl("arp://cupons")).toBe(false);
    expect(isWebUrl(null)).toBe(false);
  });

  it("nulo e indefinido → /", () => {
    expect(toAppPath(null)).toBe("/");
    expect(toAppPath(undefined)).toBe("/");
  });
});
