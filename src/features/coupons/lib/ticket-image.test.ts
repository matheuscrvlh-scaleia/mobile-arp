import { describe, expect, it } from "@jest/globals";
import { crispQrPixels, QR_QUIET_ZONE, qrBoxModules, qrModules } from "./qr";
import {
  SNAPSHOT_BASE_WIDTH,
  SNAPSHOT_QR_MIN_PX,
  SNAPSHOT_WIDTH_PX,
  snapshotFileName,
  snapshotUnit,
  ticketShareText,
  toFileUri,
  validUntilLabel,
} from "./ticket-image";

const claim = {
  code: "ARP-7K2Q9",
  expiresAt: new Date(2026, 10, 1, 18, 5).toISOString(),
  coupon: {
    id: "c1",
    title: "20% no almoço",
    headline: "20%",
    headlineSub: null,
    scheduleNote: null,
    tone: "green",
    icon: "utensils",
    imageUrl: null,
    savingsCents: null,
    weekdays: [0, 1, 2, 3, 4, 5, 6] as number[],
  },
  store: {
    id: "s1",
    slug: "cantina",
    name: "Cantina da Praça",
    icon: "utensils",
    brandColor: "#58c069",
    kind: "food",
  },
} as const;

describe("imagem do cupom", () => {
  it("sai com a mesma largura em pixels em qualquer densidade de tela", () => {
    for (const ratio of [1.5, 2, 2.625, 3, 3.5]) {
      const points = SNAPSHOT_BASE_WIDTH * snapshotUnit(ratio);
      expect(Math.round(points * ratio)).toBe(SNAPSHOT_WIDTH_PX);
    }
  });

  it("QR nítido: pixels inteiros por módulo e pelo menos o mínimo", () => {
    const box = qrBoxModules(qrModules(claim.code).size);
    expect(box).toBe(21 + QR_QUIET_ZONE * 2);
    const px = crispQrPixels(box, SNAPSHOT_QR_MIN_PX);
    expect(px).toBeGreaterThanOrEqual(600);
    expect(px % box).toBe(0);
    expect(px - SNAPSHOT_QR_MIN_PX).toBeLessThan(box);
  });

  it("descreve o prazo em hora local", () => {
    expect(validUntilLabel(claim.expiresAt)).toBe("Válido até 01/11 às 18:05");
  });

  it("monta o texto de compartilhar com código e loja", () => {
    expect(ticketShareText(claim)).toBe(
      "Meu cupom ARP: 20% no almoço\nLoja: Cantina da Praça\nCódigo: ARP-7K2Q9\nVálido até 01/11 às 18:05",
    );
  });

  it("nome de arquivo seguro e URI de arquivo", () => {
    expect(snapshotFileName("ARP-7K2Q9")).toBe("cupom-arp-ARP-7K2Q9-");
    expect(snapshotFileName("??")).toBe("cupom-arp-");
    expect(toFileUri("/tmp/x.png")).toBe("file:///tmp/x.png");
    expect(toFileUri("file:///data/x.png")).toBe("file:///data/x.png");
  });
});
