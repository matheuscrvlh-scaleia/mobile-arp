import { describe, expect, it } from "@jest/globals";
import type { CampaignProgress, Challenges, ScanResult } from "@/contracts/app/challenges";
import {
  allQrDone,
  applyScanResult,
  barPercent,
  campaignLabel,
  campaignShortName,
  daysLeft,
  daysLeftLabel,
  formatEndDay,
  isArpSealPayload,
  justReachedTier,
  lowerFirst,
  missingSealsLabel,
  nextTierText,
  normalizeTypedCode,
} from "./progress";

const tiers = [
  { threshold: 2, label: "Café grátis", icon: "coffee", reached: false },
  { threshold: 4, label: "10% off", icon: "percent", reached: false },
];

function progress(earned: number, over: Partial<CampaignProgress> = {}): CampaignProgress {
  const t = tiers.map((x) => ({ ...x, reached: earned >= x.threshold }));
  const next = t.find((x) => !x.reached);
  return {
    earned,
    total: 6,
    tiers: t,
    nextTier: next
      ? {
          threshold: next.threshold,
          label: next.label,
          icon: next.icon,
          missing: next.threshold - earned,
        }
      : null,
    ...over,
  };
}

const seal = {
  id: "s1",
  name: "Explorador",
  icon: "compass",
  gradientFrom: "#000",
  gradientTo: "#111",
};
const item = (id: string, validation: "qr" | "auto", earned = false) => ({
  id,
  title: `Desafio ${id}`,
  howTo: "Faça algo",
  icon: "award",
  validation,
  seal,
  store: null,
  event: null,
  earned,
  earnedAt: null,
  points: 10,
  repeatable: false,
  product: null,
});

describe("barPercent", () => {
  it("tem mínimo de 16% e máximo de 100%", () => {
    expect(barPercent(0, 6)).toBe(16);
    expect(barPercent(3, 6)).toBe(50);
    expect(barPercent(6, 6)).toBe(100);
    expect(barPercent(8, 6)).toBe(100);
    expect(barPercent(0, 0)).toBe(16);
  });
});

describe("dias restantes", () => {
  const now = new Date(2026, 10, 1, 15, 0);
  it("conta dias de calendário até o último dia", () => {
    expect(daysLeft(new Date(2026, 10, 30, 23, 59), now)).toBe(29);
    // fim exclusivo à meia-noite: o último dia é 30/11
    expect(daysLeft(new Date(2026, 11, 1, 0, 0), now)).toBe(29);
    expect(daysLeft(new Date(2026, 10, 1, 22, 0), now)).toBe(0);
    expect(daysLeft(new Date(2026, 9, 30), now)).toBeLessThan(0);
  });

  it("rótulos", () => {
    expect(daysLeftLabel(12)).toBe("faltam 12 dias");
    expect(daysLeftLabel(1)).toBe("falta 1 dia");
    expect(daysLeftLabel(0)).toBe("termina hoje");
    expect(daysLeftLabel(-1)).toBe("encerrado");
  });

  it("formatEndDay", () => {
    expect(formatEndDay(new Date(2026, 11, 1, 0, 0))).toBe("30/11");
    expect(formatEndDay(new Date(2026, 10, 30, 18, 0))).toBe("30/11");
  });
});

describe("textos de faixa", () => {
  it("Falta/Faltam", () => {
    expect(missingSealsLabel(1)).toBe("Falta 1 selo");
    expect(missingSealsLabel(2)).toBe("Faltam 2 selos");
  });

  it("nextTierText", () => {
    expect(nextTierText(progress(0))).toBe("Faltam 2 selos para: Café grátis");
    expect(nextTierText(progress(3))).toBe("Falta 1 selo para: 10% off");
    expect(nextTierText(progress(6))).toBe("Você completou o mês! 🎉");
    expect(nextTierText(progress(2, { tiers: [], nextTier: null }))).toBe(
      "Faltam 4 selos para completar o mês",
    );
  });

  it("justReachedTier", () => {
    expect(justReachedTier(progress(2))?.label).toBe("Café grátis");
    expect(justReachedTier(progress(3))).toBeNull();
    expect(justReachedTier(progress(4))?.label).toBe("10% off");
  });

  it("lowerFirst", () => {
    expect(lowerFirst("Café grátis")).toBe("café grátis");
  });
});

describe("campanha", () => {
  it("nome curto e rótulo sem repetir", () => {
    expect(campaignShortName("Desafios de novembro")).toBe("novembro");
    expect(campaignLabel("Desafios de novembro")).toBe("Desafios de novembro");
    expect(campaignLabel("Natal na ARP")).toBe("Desafios de Natal na ARP");
  });

  it("allQrDone", () => {
    expect(allQrDone(undefined)).toBe(false);
    expect(allQrDone({ challenges: [item("a", "qr", true), item("b", "auto")] })).toBe(true);
    expect(allQrDone({ challenges: [item("a", "qr", true), item("b", "qr")] })).toBe(false);
    expect(allQrDone({ challenges: [item("b", "auto")] })).toBe(false);
  });
});

describe("QR", () => {
  it("reconhece o payload da ARP", () => {
    expect(isArpSealPayload("arp://selo/abc123")).toBe(true);
    expect(isArpSealPayload("  arp://selo/abc123 ")).toBe(true);
    expect(isArpSealPayload("arp://selo/")).toBe(false);
    expect(isArpSealPayload("https://example.com")).toBe(false);
  });

  it("normaliza o código digitado", () => {
    expect(normalizeTypedCode(" abc ")).toBe("arp://selo/abc");
    expect(normalizeTypedCode("arp://selo/abc")).toBe("arp://selo/abc");
    expect(normalizeTypedCode("   ")).toBe("");
  });
});

describe("applyScanResult", () => {
  it("marca o desafio e troca o progresso", () => {
    const data: Challenges = {
      campaign: null,
      challenges: [item("a", "qr"), item("b", "qr")],
      progress: progress(0),
    };
    const result: ScanResult = {
      seal,
      challenge: { id: "b", title: "Desafio b" },
      campaign: { id: "c", name: "Desafios de novembro" },
      earnedAt: "2026-11-01T12:00:00.000Z",
      progress: progress(1),
      points: 10,
      totalPoints: 10,
    };
    const next = applyScanResult(data, result);
    expect(next.challenges[1]).toMatchObject({ earned: true, earnedAt: result.earnedAt });
    expect(next.challenges[0]?.earned).toBe(false);
    expect(next.progress.earned).toBe(1);
    expect(data.challenges[1]?.earned).toBe(false);
  });
});
