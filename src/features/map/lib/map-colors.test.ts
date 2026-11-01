import { describe, expect, it } from "@jest/globals";
import { contrastRatio } from "@/design/theme/contrast";
import { mapColors } from "./map-colors";

describe("mapColors (escuro)", () => {
  const m = mapColors.dark;

  it("rótulos legíveis sobre o que está atrás", () => {
    expect(contrastRatio(m.blockLabel, m.block)).toBeGreaterThanOrEqual(4);
    expect(contrastRatio(m.parkingLabel, m.parkingBase)).toBeGreaterThanOrEqual(4);
    expect(contrastRatio(m.faintLabel, m.bg)).toBeGreaterThanOrEqual(3.5);
    expect(contrastRatio(m.greenLabel, m.plaza)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(m.greenLabel, m.terrace)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(m.youText, m.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("contornos aparecem sobre o fundo do mapa", () => {
    expect(contrastRatio(m.blockStroke, m.bg)).toBeGreaterThan(1.3);
    expect(contrastRatio(m.voidStroke, m.bg)).toBeGreaterThan(1.5);
    expect(contrastRatio(m.tree, m.plaza)).toBeGreaterThan(1.4);
  });

  it("os dois temas têm as mesmas chaves", () => {
    expect(Object.keys(mapColors.dark).sort()).toEqual(Object.keys(mapColors.light).sort());
  });
});
