import { describe, expect, it } from "@jest/globals";
import { contrastRatio, relativeLuminance } from "./contrast";
import {
  type Palette,
  palettes,
  paletteTones,
  type ThemeColor,
  type ThemeScheme,
} from "./palettes";

/* Só módulos puros (paletas e contraste): nada de React Native aqui. */

describe("contrastRatio", () => {
  it("bate com os valores de referência da WCAG", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    // simétrico
    expect(contrastRatio("#58c069", "#141714")).toBeCloseTo(contrastRatio("#141714", "#58c069"));
    // #767676 sobre branco é o cinza mais claro que passa AA (4.54)
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("compõe cor translúcida sobre o fundo antes de medir", () => {
    expect(contrastRatio("rgba(0, 0, 0, 0)", "#ffffff")).toBeCloseTo(1, 5);
    const half = contrastRatio("rgba(255, 255, 255, 0.5)", "#000000");
    expect(half).toBeGreaterThan(4);
    expect(half).toBeLessThan(contrastRatio("#ffffff", "#000000"));
  });

  it("recusa cor que não entende", () => {
    expect(() => contrastRatio("transparent", "#fff")).toThrow();
  });
});

type Pair = { fg: ThemeColor; bg: ThemeColor; min: number; why: string };

/** AA texto normal 4.5; texto grande e ícone/forma 3. */
const PAIRS: Pair[] = [
  { fg: "text", bg: "bg", min: 4.5, why: "texto principal" },
  { fg: "text", bg: "surface", min: 4.5, why: "texto em cartão" },
  { fg: "text", bg: "surfaceRaised", min: 4.5, why: "texto no painel" },
  { fg: "textSecondary", bg: "bg", min: 4.5, why: "texto de leitura" },
  { fg: "textMuted", bg: "bg", min: 4.5, why: "texto secundário" },
  { fg: "textMuted", bg: "surface", min: 4.5, why: "texto secundário em cartão" },
  { fg: "onInverse", bg: "inverse", min: 4.5, why: "botão/pílula dark, chip ligado" },
  { fg: "onChrome", bg: "chrome", min: 4.5, why: "barra de abas, toast" },
  { fg: "onChromeMuted", bg: "chrome", min: 4.5, why: "aba inativa" },
  { fg: "onChromeActive", bg: "chromeActive", min: 4.5, why: "aba ativa" },
  { fg: "onBrand", bg: "brand", min: 4.5, why: "texto em botão verde" },
  { fg: "brandText", bg: "bg", min: 4.5, why: "texto verde" },
  { fg: "dangerText", bg: "bg", min: 4.5, why: "texto de alerta" },
  { fg: "dangerText", bg: "dangerSoft", min: 4, why: "pílula clay (12/650)" },
  { fg: "brandText", bg: "brand100", min: 4, why: "pílula brand (12/650)" },
  { fg: "danger", bg: "bg", min: 3, why: "ícone de favorito/alerta" },
  { fg: "brand", bg: "bg", min: 1.9, why: "verde decorativo (barra das abas de texto)" },
];

function check(scheme: ThemeScheme, p: Palette) {
  for (const { fg, bg, min, why } of PAIRS) {
    const ratio = contrastRatio(p[fg], p[bg]);
    if (ratio < min) {
      throw new Error(`${scheme}: ${fg} sobre ${bg} = ${ratio.toFixed(2)} < ${min} (${why})`);
    }
  }
}

describe("paletas", () => {
  it("têm as mesmas chaves nos dois temas", () => {
    expect(Object.keys(palettes.dark).sort()).toEqual(Object.keys(palettes.light).sort());
  });

  it("tema claro: pares principais com contraste mínimo", () => {
    expect(() => check("light", palettes.light)).not.toThrow();
  });

  it("tema escuro: pares principais com contraste mínimo", () => {
    expect(() => check("dark", palettes.dark)).not.toThrow();
  });

  it("textMuted: AA (4.5) no escuro sobre bg, surface e surfaceRaised", () => {
    const d = palettes.dark;
    for (const bg of ["bg", "surface", "surfaceRaised"] as const) {
      expect(contrastRatio(d.textMuted, d[bg])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("textMuted no claro: tom do protótipo escurecido para passar AA", () => {
    const l = palettes.light;
    expect(l.textMuted).toBe("#686d67");
    expect(contrastRatio(l.textMuted, l.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("escuro: superfícies em degraus a partir do fundo e chrome distinto do fundo", () => {
    const d = palettes.dark;
    const lum = (k: ThemeColor) => relativeLuminance(d[k]);
    expect(lum("bg")).toBeLessThan(lum("surfaceSunken"));
    expect(lum("surfaceSunken")).toBeLessThan(lum("surface"));
    expect(lum("surface")).toBeLessThan(lum("surfaceRaised"));
    expect(lum("surfaceRaised")).toBeLessThan(lum("surfaceStrong"));
    expect(lum("chrome")).toBeGreaterThan(lum("bg"));
    // inverse é claro no escuro (botão "dark" vira claro)
    expect(lum("inverse")).toBeGreaterThan(0.8);
  });

  it("fixos iguais nos dois temas", () => {
    for (const k of ["brand", "onBrand", "onMedia", "onChrome", "paper", "onPaper"] as const) {
      expect(palettes.dark[k]).toBe(palettes.light[k]);
    }
  });

  it("tons ink e sand: texto AA sobre o gradiente nos dois temas", () => {
    // green/clay/deep são os do protótipo (branco sobre cor viva, texto grande e forte)
    for (const scheme of ["light", "dark"] as const) {
      for (const name of ["ink", "sand"] as const) {
        const spec = paletteTones[scheme][name];
        for (const stop of spec.gradient) {
          expect(contrastRatio(spec.fg, stop)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});
