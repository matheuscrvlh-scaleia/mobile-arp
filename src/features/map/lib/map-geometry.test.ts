import { describe, expect, it } from "@jest/globals";
import type { MapData } from "@/contracts/app/stores";
import {
  clampTranslate,
  defaultFloor,
  findPin,
  fitCanvas,
  focusTranslate,
  matchesPin,
  plazaTrees,
  sortFloorsDesc,
  toCanvas,
} from "./map-geometry";

const pin = (slug: string, kind: "food" | "shop", name: string) => ({
  storeId: `id-${slug}`,
  slug,
  name,
  icon: "store",
  brandColor: "#000000",
  kind,
  x: 100,
  y: 120,
});

const floor = (id: string, level: number, pins: ReturnType<typeof pin>[] = []) => ({
  id,
  level,
  label: id,
  shortLabel: id,
  layout: [],
  points: [],
  pins,
});

const map: MapData = {
  floors: [
    floor("1", 1, [pin("cafe-da-serra", "food", "Café da Serra")]),
    floor("T", 0, [pin("otica", "shop", "Ótica Vista")]),
    floor("S", -1),
    floor("2", 2),
  ],
};

describe("canvas", () => {
  it("cabe na área mantendo a proporção 360 × 445", () => {
    expect(fitCanvas(360, 1000)).toEqual({ width: 360, height: 445, k: 1 });
    const c = fitCanvas(1000, 222.5);
    expect(c.k).toBeCloseTo(0.5);
    expect(c.width).toBeCloseTo(180);
  });

  it("converte coordenadas do recorte (y começa em 20)", () => {
    expect(toCanvas(180, 20, 2)).toEqual({ left: 360, top: 0 });
  });

  it("limita o arrasto ao tamanho ampliado", () => {
    expect(clampTranslate(50, 1, 300)).toBe(0);
    expect(clampTranslate(500, 2, 300)).toBe(150);
    expect(clampTranslate(-500, 2, 300)).toBe(-150);
  });

  it("centraliza um ponto", () => {
    const canvas = { width: 300, height: 400 };
    expect(focusTranslate(150, 200, canvas, 2)).toEqual({ x: -0, y: -0 });
    expect(focusTranslate(100, 200, canvas, 2)).toEqual({ x: 100, y: -0 });
    // canto: limitado
    expect(focusTranslate(0, 0, canvas, 2)).toEqual({ x: 150, y: 200 });
  });
});

describe("andares e lojas", () => {
  it("ordena como elevador e abre no térreo", () => {
    expect(sortFloorsDesc(map.floors).map((f) => f.level)).toEqual([2, 1, 0, -1]);
    expect(defaultFloor(map.floors)?.id).toBe("T");
    expect(defaultFloor([floor("S", -1), floor("1", 1)])?.id).toBe("1");
  });

  it("acha a loja por slug ou id", () => {
    expect(findPin(map, "cafe-da-serra")?.floor.id).toBe("1");
    expect(findPin(map, "id-otica")?.pin.name).toBe("Ótica Vista");
    expect(findPin(map, "nada")).toBeUndefined();
  });

  it("filtra por tipo e nome sem acento", () => {
    const p = pin("otica", "shop", "Ótica Vista");
    expect(matchesPin(p, "all", "otica")).toBe(true);
    expect(matchesPin(p, "food", "")).toBe(false);
    expect(matchesPin(p, "shop", "café")).toBe(false);
  });

  it("árvores dentro da praça", () => {
    const trees = plazaTrees({ kind: "plaza", label: "", x: 100, y: 214, w: 160, h: 72 });
    expect(trees[0]).toEqual({ x: 118, y: 236 });
    expect(trees).toHaveLength(6);
  });
});
