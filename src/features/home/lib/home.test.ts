import { describe, expect, it } from "@jest/globals";
import { daysLeftInMonth, eventSubtitle, highlightTarget, pairs } from "./home";

describe("daysLeftInMonth", () => {
  it("conta o dia de hoje", () => {
    expect(daysLeftInMonth(new Date(2026, 10, 1))).toBe(30);
    expect(daysLeftInMonth(new Date(2026, 10, 30))).toBe(1);
    expect(daysLeftInMonth(new Date(2026, 1, 28))).toBe(1);
  });
});

describe("eventSubtitle", () => {
  it("quando e local curto", () => {
    expect(eventSubtitle("Todo o mês", "Ruas internas · Térreo")).toBe(
      "Todo o mês · Ruas internas",
    );
    expect(eventSubtitle("14h às 17h", "Casa Mata · Bloco 81")).toBe("14h às 17h · Casa Mata");
    expect(eventSubtitle(null, "Praça")).toBe("Praça");
  });
});

describe("highlightTarget", () => {
  const base = { targetId: null, targetSlug: null, targetUrl: null };

  it("resolve cada tipo de alvo", () => {
    expect(highlightTarget({ ...base, targetType: "event", targetId: "e1" })).toEqual({
      kind: "path",
      href: "/evento/e1",
    });
    expect(highlightTarget({ ...base, targetType: "coupon", targetId: "c1" })).toEqual({
      kind: "path",
      href: "/cupom/c1",
    });
    expect(highlightTarget({ ...base, targetType: "url", targetUrl: "https://arp.com" })).toEqual({
      kind: "url",
      url: "https://arp.com",
    });
    expect(highlightTarget({ ...base, targetType: "event" })).toEqual({ kind: "none" });
    expect(highlightTarget({ ...base, targetType: "none", targetId: "x" })).toEqual({
      kind: "none",
    });
  });

  it("loja abre pelo slug e cai no id sem slug", () => {
    expect(
      highlightTarget({ ...base, targetType: "store", targetId: "s1", targetSlug: "casa-mata" }),
    ).toEqual({ kind: "path", href: "/loja/casa-mata" });
    expect(highlightTarget({ ...base, targetType: "store", targetId: "s1" })).toEqual({
      kind: "path",
      href: "/loja/s1",
    });
    expect(highlightTarget({ ...base, targetType: "store" })).toEqual({ kind: "none" });
  });
});

describe("pairs", () => {
  it("agrupa de dois em dois", () => {
    expect(pairs([1, 2, 3])).toEqual([
      [1, 2],
      [3, undefined],
    ]);
    expect(pairs([])).toEqual([]);
  });
});
