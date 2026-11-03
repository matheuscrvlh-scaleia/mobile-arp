import { describe, expect, it } from "@jest/globals";
import type { InfiniteData } from "@tanstack/react-query";
import type { Claim, CouponCard, CouponDetail, Wallet } from "@/contracts/app/coupons";
import { activeClaimFor, findClaim, findCouponCard, insertActiveClaim, tabOf } from "./claim-cache";
import { CLAIM_STATUS, effectiveStatus, pillLabel } from "./claim-status";
import { couponQueryFor, filterCoupons } from "./filters";
import {
  applyClaim,
  byExpiry,
  isEnding,
  isSoldOut,
  isUrgent,
  markSoldOut,
  nextExpiring,
  showsStockGrid,
  soldOutLast,
  stockCells,
  stockColumns,
  stockRatio,
  stockRows,
  takenCount,
  totalSavingsCents,
} from "./stock";

const store = {
  id: "s1",
  slug: "casa-brava",
  name: "Casa Brava",
  icon: "beer",
  brandColor: "#c8692f",
  kind: "food" as const,
};

function coupon(id: string, total: number, remaining: number): CouponCard {
  return {
    id,
    store,
    title: `Cupom ${id}`,
    headline: "R$ 5",
    headlineSub: null,
    description: null,
    scheduleNote: null,
    startsAt: "2026-11-01T03:00:00.000Z",
    endsAt: null,
    redeemWindowHours: 24,
    tone: "green",
    icon: "beer",
    imageUrl: null,
    savingsCents: 500,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    stock: { total, remaining },
  };
}

function claim(id: string, expiresAt: string, status: Claim["status"] = "active"): Claim {
  return {
    id,
    code: `ARP-${id}`,
    status,
    claimedAt: "2026-11-01T10:00:00.000Z",
    expiresAt,
    redeemedAt: null,
    coupon: {
      id: "c1",
      title: "Chopp",
      headline: "R$ 5",
      headlineSub: null,
      scheduleNote: null,
      tone: "green",
      icon: "beer",
      imageUrl: null,
      savingsCents: 500,
      weekdays: [0, 1, 2, 3, 4, 5, 6],
    },
    store,
  };
}

function walletPages(claims: Claim[]): InfiniteData<Wallet> {
  return {
    pageParams: [1],
    pages: [
      {
        data: claims,
        meta: { page: 1, pageSize: 20, total: claims.length, totalPages: 1 },
        counts: { active: claims.length, used: 0, expired: 0 },
      },
    ],
  };
}

describe("estoque", () => {
  it("colunas: até 15 numa linha, acima disso duas linhas", () => {
    expect(stockColumns(3)).toBe(3);
    expect(stockColumns(15)).toBe(15);
    expect(stockColumns(16)).toBe(8);
    expect(stockColumns(25)).toBe(13);
    expect(stockColumns(50)).toBe(25);
    expect(stockColumns(0)).toBe(1);
  });

  it("grade só até 60 unidades", () => {
    expect(showsStockGrid(60)).toBe(true);
    expect(showsStockGrid(61)).toBe(false);
    expect(showsStockGrid(0)).toBe(false);
  });

  it("células: pegos primeiro e o do visitante no último pego", () => {
    expect(stockCells({ total: 5, remaining: 3 }, false)).toEqual([
      "taken",
      "taken",
      "free",
      "free",
      "free",
    ]);
    expect(stockCells({ total: 5, remaining: 3 }, true)).toEqual([
      "taken",
      "me",
      "free",
      "free",
      "free",
    ]);
    // remaining fora da faixa não quebra a grade
    expect(stockCells({ total: 2, remaining: 5 }, true)).toEqual(["free", "free"]);
    expect(stockCells({ total: 2, remaining: -1 }, false)).toEqual(["taken", "taken"]);
  });

  it("linhas completam a última com null", () => {
    expect(stockRows([1, 2, 3, 4, 5], 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, null],
    ]);
  });

  it("urgência, acabando, esgotado e proporção", () => {
    expect(isUrgent(3)).toBe(true);
    expect(isUrgent(4)).toBe(false);
    expect(isUrgent(0)).toBe(false);
    expect(isEnding({ total: 10, remaining: 5 })).toBe(true);
    expect(isEnding({ total: 10, remaining: 0 })).toBe(false);
    expect(isSoldOut({ total: 10, remaining: 0 })).toBe(true);
    expect(stockRatio({ total: 20, remaining: 5 })).toBe(0.25);
    expect(stockRatio({ total: 0, remaining: 0 })).toBe(0);
    expect(takenCount({ total: 20, remaining: 5 })).toBe(15);
  });
});

describe("economia", () => {
  it("soma só os usados", () => {
    expect(
      totalSavingsCents([
        claim("a", "2026-11-02T00:00:00.000Z", "used"),
        claim("b", "2026-11-02T00:00:00.000Z", "used"),
        claim("c", "2026-11-02T00:00:00.000Z", "expired"),
      ]),
    ).toBe(1000);
  });
});

describe("ordenação e filtros", () => {
  it("esgotados por último, mantendo a ordem dos demais", () => {
    const list = [coupon("a", 10, 0), coupon("b", 10, 2), coupon("c", 10, 0), coupon("d", 5, 5)];
    expect(soldOutLast(list).map((c) => c.id)).toEqual(["b", "d", "a", "c"]);
  });

  it("acabando: sort=ending na API e 1..5 no cliente", () => {
    expect(couponQueryFor("ending")).toEqual({ sort: "ending" });
    expect(couponQueryFor("food")).toEqual({ kind: "food" });
    expect(couponQueryFor("all")).toEqual({});
    const list = [coupon("a", 10, 0), coupon("b", 10, 2), coupon("c", 10, 6)];
    expect(filterCoupons("ending", list).map((c) => c.id)).toEqual(["b"]);
    expect(filterCoupons("all", list)).toHaveLength(3);
  });

  it("próximo a vencer", () => {
    const now = Date.parse("2026-11-01T12:00:00.000Z");
    const list = [
      claim("late", "2026-11-02T12:00:00.000Z"),
      claim("gone", "2026-11-01T11:00:00.000Z"),
      claim("soon", "2026-11-01T13:00:00.000Z"),
    ];
    expect(byExpiry(list).map((c) => c.id)).toEqual(["gone", "soon", "late"]);
    expect(nextExpiring(list, now)?.id).toBe("soon");
    expect(nextExpiring([], now)).toBeNull();
  });
});

describe("pego", () => {
  it("ativo vencido aparece como expirado", () => {
    const c = claim("a", "2026-11-01T12:00:00.000Z");
    expect(effectiveStatus(c, Date.parse("2026-11-01T11:59:59.000Z"))).toBe("active");
    expect(effectiveStatus(c, Date.parse("2026-11-01T12:00:00.000Z"))).toBe("expired");
    expect(effectiveStatus({ ...c, status: "used" }, Number.POSITIVE_INFINITY)).toBe("used");
  });

  it("applyClaim guarda o pego e desconta uma unidade", () => {
    const detail: CouponDetail = { ...coupon("c1", 10, 1), myClaim: null };
    const next = applyClaim(detail, claim("x", "2026-11-02T00:00:00.000Z"));
    expect(next.myClaim?.id).toBe("x");
    expect(next.stock.remaining).toBe(0);
    expect(applyClaim(next, claim("y", "2026-11-02T00:00:00.000Z")).stock.remaining).toBe(0);
    expect(detail.stock.remaining).toBe(1);
  });

  it("insere o pego novo na aba ativos por vencimento", () => {
    const data = walletPages([
      claim("a", "2026-11-01T13:00:00.000Z"),
      claim("b", "2026-11-03T13:00:00.000Z"),
    ]);
    const next = insertActiveClaim(data, claim("n", "2026-11-02T13:00:00.000Z"));
    expect(next?.pages[0]?.data.map((c) => c.id)).toEqual(["a", "n", "b"]);
    expect(next?.pages[0]?.counts.active).toBe(3);
    // já presente: não duplica
    expect(insertActiveClaim(next, claim("n", "2026-11-02T13:00:00.000Z"))).toBe(next);
    expect(insertActiveClaim(undefined, claim("n", "2026-11-02T13:00:00.000Z"))).toBeUndefined();
  });

  it("acha o pego no cache (carteira e detalhe), o mais recente vence", () => {
    const old = claim("x", "2026-11-02T00:00:00.000Z", "active");
    const fresh = { ...old, status: "used" as const };
    const found = findClaim(
      [
        { source: "wallet", data: walletPages([old]), updatedAt: 1 },
        { source: "wallet", data: walletPages([fresh]), updatedAt: 5 },
        // formato errado para a fonte: ignorado
        { source: "wallet", data: old, updatedAt: 9 },
        { source: "detail", data: { ...coupon("c1", 10, 2), myClaim: old }, updatedAt: 3 },
      ],
      "x",
    );
    expect(found?.claim.status).toBe("used");
    expect(findClaim([], "x")).toBeNull();
  });
});

describe("situação do pego", () => {
  it("cada status tem aba, carimbo e etiqueta", () => {
    expect(tabOf("cancelled")).toBe("expired");
    expect(tabOf("active")).toBe("active");
    expect(CLAIM_STATUS.active.stamp).toBeNull();
    expect(CLAIM_STATUS.used.stamp?.text).toBe("USADO");
    expect(pillLabel({ redeemedAt: null }, "active")).toBeNull();
    expect(pillLabel({ redeemedAt: null }, "used")).toBe("Usado");
    expect(pillLabel({ redeemedAt: "2026-10-12T15:00:00.000Z" }, "used")).toMatch(/^Usado em /);
    expect(pillLabel({ redeemedAt: null }, "expired")).toBe("Voltou para a promoção");
  });

  it("acha o pego ativo de um cupom na aba ativos", () => {
    const c = {
      ...claim("x", "2026-11-02T00:00:00.000Z"),
      coupon: { ...claim("x", "").coupon, id: "c9" },
    };
    expect(activeClaimFor(walletPages([c]), "c9")?.id).toBe("x");
    expect(activeClaimFor(walletPages([c]), "outro")).toBeNull();
    expect(activeClaimFor(undefined, "c9")).toBeNull();
  });
});

describe("cartão em cache", () => {
  const card = coupon("c7", 10, 4);
  it("acha o cartão em qualquer formato público", () => {
    const infinite = { pages: [{ data: [coupon("c1", 5, 1), card], meta: {} }], pageParams: [1] };
    expect(findCouponCard(infinite, "c7")?.id).toBe("c7");
    expect(findCouponCard({ endingCoupons: [card], events: [] }, "c7")?.id).toBe("c7");
    expect(findCouponCard({ id: "loja", name: "Loja", coupons: [card] }, "c7")?.id).toBe("c7");
    expect(findCouponCard([card], "c7")?.id).toBe("c7");
    expect(findCouponCard(infinite, "nada")).toBeUndefined();
    expect(findCouponCard(null, "c7")).toBeUndefined();
  });

  it("esgotado recusado zera o que resta", () => {
    expect(markSoldOut(card).stock).toEqual({ total: 10, remaining: 0 });
    expect(card.stock.remaining).toBe(4);
  });
});
