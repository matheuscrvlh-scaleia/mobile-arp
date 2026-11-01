import { describe, expect, it } from "@jest/globals";
import type { MerchantClaim } from "@/contracts/app/merchant";
import { ApiError } from "@/core/api/errors";
import { codeBody, codeFromScan, fullCode, isCompleteBody } from "./code";
import { loginAlert } from "./login";
import {
  couponWindowLabel,
  dayTimeLabel,
  filterStores,
  hourBars,
  hourWindow,
  peakHour,
  redemptionTime,
  showsStockGrid,
  stockBreakdown,
  stockCells,
  stockColumns,
  stockRows,
} from "./overview";
import { alreadyUsedTitle, claimProblem, failureFromError } from "./validation";

const at = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();
const NOW = at(2026, 11, 1, 15, 0);
const iso = (ms: number) => new Date(ms).toISOString();

const hours = (counts: Record<number, number>) =>
  Array.from({ length: 24 }, (_, hour) => ({ hour, count: counts[hour] ?? 0 }));

const apiError = (
  code: ConstructorParameters<typeof ApiError>[0],
  status = 400,
  retryAfter?: number,
) => new ApiError(code, "msg", status, null, null, retryAfter ?? null);

describe("código do cupom", () => {
  it("normaliza o que é digitado (maiúsculas, só letras e números, até 6)", () => {
    expect(codeBody("4hx")).toBe("4HX");
    expect(codeBody("4h-x p")).toBe("4HXP");
    expect(codeBody("4HXP2KZ")).toBe("4HXP2K");
  });

  it("aceita colar o código inteiro, com ou sem hífen", () => {
    expect(codeBody("ARP-4HXP2K")).toBe("4HXP2K");
    expect(codeBody(" arp4hxp2k ")).toBe("4HXP2K");
    expect(codeBody("arp 4hxp2k")).toBe("4HXP2K");
    // colado por cima de um começo já digitado
    expect(codeBody("4HARP-4HXP2K")).toBe("4HXP2K");
  });

  it("corpo que começa com ARP continua valendo", () => {
    expect(codeBody("ARPXYZ")).toBe("ARPXYZ");
    expect(codeBody("ARP-ARPXYZ")).toBe("ARPXYZ");
  });

  it("monta e confere o código completo", () => {
    expect(fullCode("4HXP2K")).toBe("ARP-4HXP2K");
    expect(isCompleteBody("4HXP2K")).toBe(true);
    expect(isCompleteBody("4HXP2")).toBe(false);
    expect(isCompleteBody("")).toBe(false);
  });

  it("QR do ticket: só aceita um código ARP", () => {
    expect(codeFromScan(" arp-4hxp2k\n")).toBe("ARP-4HXP2K");
    expect(codeFromScan("https://arp.com.br/selo/abc")).toBeNull();
    expect(codeFromScan("ARP-4HXP")).toBeNull();
  });
});

describe("estoque", () => {
  it("usado + aguardando + voltou + livre = total (voltou faz parte dos livres)", () => {
    const b = stockBreakdown({ total: 20, redeemed: 8, waiting: 4, returned: 2 });
    expect(b).toEqual({ total: 20, used: 8, waiting: 4, returned: 2, free: 6, available: 8 });
    expect(b.used + b.waiting + b.returned + b.free).toBe(b.total);
  });

  it("nunca passa do total, mesmo com números incoerentes", () => {
    const b = stockBreakdown({ total: 10, redeemed: 7, waiting: 6, returned: 9 });
    expect(b).toEqual({ total: 10, used: 7, waiting: 3, returned: 0, free: 0, available: 0 });
    const neg = stockBreakdown({ total: 5, redeemed: -1, waiting: 0, returned: 0 });
    expect(neg.free).toBe(5);
  });

  it("células na ordem usado → aguardando → voltou → livre", () => {
    const cells = stockCells(stockBreakdown({ total: 6, redeemed: 2, waiting: 1, returned: 1 }));
    expect(cells).toEqual(["used", "used", "waiting", "returned", "free", "free"]);
  });

  it("grade até 60, colunas de no máximo 15 em linhas iguais", () => {
    expect(showsStockGrid(0)).toBe(false);
    expect(showsStockGrid(60)).toBe(true);
    expect(showsStockGrid(61)).toBe(false);
    expect(stockColumns(10)).toBe(10);
    expect(stockColumns(30)).toBe(15);
    expect(stockColumns(40)).toBe(14);
    expect(stockColumns(60)).toBe(15);
    const rows = stockRows([1, 2, 3, 4, 5], 3);
    expect(rows).toEqual([
      [1, 2, 3],
      [4, 5, null],
    ]);
  });
});

describe("usos por hora", () => {
  it("sem movimento: 8h às 23h, sem pico", () => {
    expect(hourWindow(hours({}))).toEqual({ from: 8, to: 23 });
    expect(peakHour(hours({}))).toBeNull();
  });

  it("recorta do primeiro ao último horário com uso, ±1 h", () => {
    expect(hourWindow(hours({ 10: 1, 13: 1, 15: 1, 18: 2 }))).toEqual({ from: 9, to: 19 });
  });

  it("garante pelo menos 8 colunas e respeita 0h–23h", () => {
    expect(hourWindow(hours({ 19: 3 }))).toEqual({ from: 16, to: 23 });
    expect(hourWindow(hours({ 23: 1 }))).toEqual({ from: 16, to: 23 });
    expect(hourWindow(hours({ 0: 1 }))).toEqual({ from: 0, to: 7 });
  });

  it("pico = hora com mais usos (a primeira no empate) e sempre com rótulo", () => {
    const rows = hours({ 17: 1, 18: 3, 19: 3, 20: 1 });
    expect(peakHour(rows)).toBe(18);
    const bars = hourBars(rows);
    expect(bars.map((b) => b.hour)).toEqual([15, 16, 17, 18, 19, 20, 21, 22]);
    expect(bars.filter((b) => b.peak).map((b) => b.hour)).toEqual([18]);
    expect(bars.every((b) => b.showLabel)).toBe(true);
  });

  it("muitas colunas: rótulos alternados, mas o pico aparece", () => {
    const bars = hourBars(hours({ 1: 1, 21: 2 }));
    expect(bars).toHaveLength(23);
    expect(bars.find((b) => b.hour === 21)?.showLabel).toBe(true);
    expect(bars.filter((b) => b.showLabel).length).toBeLessThan(bars.length);
  });
});

describe("rótulos", () => {
  it("vigência do cupom", () => {
    expect(couponWindowLabel({ endsAt: null }, NOW)).toBe("sem data para acabar");
    expect(couponWindowLabel({ endsAt: iso(at(2026, 11, 1, 22, 0)) }, NOW)).toBe("até hoje, 22:00");
    expect(couponWindowLabel({ endsAt: iso(at(2026, 11, 2, 1, 0)) }, NOW)).toBe("até 02/11");
  });

  it("hora do uso: só a hora hoje, com o dia nos outros", () => {
    expect(redemptionTime(iso(at(2026, 11, 1, 9, 5)), NOW)).toBe("09:05");
    expect(redemptionTime(iso(at(2026, 10, 31, 21, 42)), NOW)).toBe("31/10 · 21:42");
    expect(dayTimeLabel(iso(at(2026, 11, 1, 14, 32)), NOW)).toBe("hoje às 14:32");
    expect(dayTimeLabel(iso(at(2026, 10, 30, 8, 0)), NOW)).toBe("30/10 às 08:00");
  });

  it("busca de loja ignora acento e maiúscula", () => {
    const stores = [{ name: "Café da Serra" }, { name: "Casa Brava" }, { name: "Doce Tília" }];
    expect(filterStores(stores, "cafe").map((s) => s.name)).toEqual(["Café da Serra"]);
    expect(filterStores(stores, "TILIA").map((s) => s.name)).toEqual(["Doce Tília"]);
    expect(filterStores(stores, "  ")).toHaveLength(3);
  });
});

describe("validação no caixa", () => {
  const claim = (over: Partial<MerchantClaim>): MerchantClaim => ({
    id: "c1",
    code: "ARP-4HXP2K",
    status: "active",
    claimedAt: iso(NOW - 3_600_000),
    expiresAt: iso(NOW + 3_600_000),
    redeemedAt: null,
    coupon: { id: "p1", title: "15% OFF em toda a loja", headline: "15% OFF" },
    store: { id: "s1", name: "Casa Brava" },
    visitor: { firstName: "Ana" },
    ...over,
  });

  it("pego ativo e no prazo pode ser confirmado", () => {
    expect(claimProblem(claim({}), NOW)).toBeNull();
  });

  it("pego que não pode mais ser usado explica o motivo", () => {
    const used = claimProblem(
      claim({ status: "redeemed", redeemedAt: iso(at(2026, 11, 1, 13, 10)) }),
      NOW,
    );
    expect(used?.title).toBe("Este código já foi usado às 13:10");
    expect(claimProblem(claim({ status: "expired" }), NOW)?.title).toBe("Este código venceu");
    expect(claimProblem(claim({ expiresAt: iso(NOW - 1) }), NOW)?.title).toBe("Este código venceu");
    expect(claimProblem(claim({ status: "cancelled" }), NOW)?.icon).toBe("circle-minus");
  });

  it("já usado: com a hora quando houver, com o dia se não foi hoje", () => {
    expect(alreadyUsedTitle(null, NOW)).toBe("Este código já foi usado");
    expect(alreadyUsedTitle(iso(at(2026, 10, 31, 19, 42)), NOW)).toBe(
      "Este código já foi usado em 31/10 às 19:42",
    );
  });

  it("recusas da API viram mensagens claras", () => {
    const now = { now: NOW };
    expect(failureFromError(apiError("NOT_FOUND", 404), now).title).toBe("Código não encontrado");
    expect(failureFromError(apiError("CLAIM_EXPIRED", 410), now).title).toBe("Este código venceu");
    expect(failureFromError(apiError("CLAIM_WRONG_STORE", 403), now).title).toBe(
      "Este cupom é de outra loja",
    );
    expect(failureFromError(apiError("VALIDATION_ERROR", 400), now).title).toBe("Código inválido");
    expect(failureFromError(apiError("CLAIM_CANCELLED", 409), now).title).toBe(
      "Este código foi cancelado",
    );
    expect(
      failureFromError(apiError("CLAIM_ALREADY_REDEEMED", 409), {
        now: NOW,
        redeemedAt: iso(at(2026, 11, 1, 14, 5)),
      }).title,
    ).toBe("Este código já foi usado às 14:05");
  });

  it("falha passageira vira aviso curto", () => {
    const failure = failureFromError(apiError("NETWORK_ERROR", 0), { now: NOW });
    expect(failure.kind).toBe("toast");
    expect(failure.title).toMatch(/conexão/);
  });
});

describe("login do lojista", () => {
  it("credenciais e falta de acesso", () => {
    expect(loginAlert(apiError("INVALID_CREDENTIALS", 401))).toMatch(/incorretos/);
    expect(loginAlert(apiError("FORBIDDEN", 403))).toBe(
      "Este usuário não tem acesso ao caixa de nenhuma loja.",
    );
    expect(loginAlert(apiError("INTERNAL_ERROR", 500))).toBeNull();
  });
});
