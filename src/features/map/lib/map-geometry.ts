import type { MapData } from "@/contracts/app/stores";
import type { MapShape, StoreKind } from "@/contracts/directory";
import { matchesQuery } from "@/shared/lib/text";

/* Regras do mapa, puras: área do desenho, zoom/arrasto, andares e filtros. */

export type MapFloor = MapData["floors"][number];
export type MapPin = MapFloor["pins"][number];
export type MapCategory = "all" | StoreKind;

/** Recorte do desenho mostrado (o protótipo usa viewBox="0 20 360 445"). */
export const VIEW = { x: 0, y: 20, width: 360, height: 445 } as const;

export const MIN_SCALE = 1;
export const MAX_SCALE = 3;
/** Zoom aplicado ao focar uma loja escolhida na lista ou por link. */
export const FOCUS_SCALE = 1.8;

export type CanvasSize = { width: number; height: number; k: number };

/** Maior desenho que cabe na área mantendo a proporção do recorte (preserveAspectRatio meet). */
export function fitCanvas(areaWidth: number, areaHeight: number): CanvasSize {
  const k = Math.max(0, Math.min(areaWidth / VIEW.width, areaHeight / VIEW.height));
  return { width: VIEW.width * k, height: VIEW.height * k, k };
}

/** Coordenada do desenho (viewBox) → pixel dentro do desenho. */
export function toCanvas(x: number, y: number, k: number): { left: number; top: number } {
  return { left: (x - VIEW.x) * k, top: (y - VIEW.y) * k };
}

export function clamp(v: number, min: number, max: number): number {
  "worklet";
  return Math.min(max, Math.max(min, v));
}

/** Arrasto máximo para o desenho ampliado não sair da área (origem do transform no centro). */
export function clampTranslate(t: number, scale: number, size: number): number {
  "worklet";
  const max = Math.max(0, (size * scale - size) / 2);
  return Math.min(max, Math.max(-max, t));
}

/** Translação que põe o ponto (px, py do desenho) no centro, já limitada. */
export function focusTranslate(
  left: number,
  top: number,
  canvas: Pick<CanvasSize, "width" | "height">,
  scale: number,
): { x: number; y: number } {
  return {
    x: clampTranslate(-(left - canvas.width / 2) * scale, scale, canvas.width),
    y: clampTranslate(-(top - canvas.height / 2) * scale, scale, canvas.height),
  };
}

/** Andares como no elevador: o mais alto em cima. */
export function sortFloorsDesc(floors: readonly MapFloor[]): MapFloor[] {
  return [...floors].sort((a, b) => b.level - a.level);
}

/** Abre no térreo (ou no andar mais perto dele). */
export function defaultFloor(floors: readonly MapFloor[]): MapFloor | undefined {
  return [...floors].sort((a, b) => Math.abs(a.level) - Math.abs(b.level) || b.level - a.level)[0];
}

/** Loja do link (`?loja=` aceita slug ou id) e o andar dela. */
export function findPin(
  map: MapData,
  slugOrId: string,
): { floor: MapFloor; pin: MapPin } | undefined {
  for (const floor of map.floors) {
    const pin = floor.pins.find((p) => p.slug === slugOrId || p.storeId === slugOrId);
    if (pin) return { floor, pin };
  }
  return undefined;
}

export function matchesPin(pin: MapPin, category: MapCategory, q: string): boolean {
  // a loja pode estar em mais de uma categoria (Fase 2)
  return (category === "all" || pin.kinds.includes(category)) && matchesQuery(pin.name, q);
}

/** Árvores da praça, nas mesmas posições relativas do protótipo (praça 160 × 72). */
const TREES: readonly (readonly [number, number])[] = [
  [18, 22],
  [142, 22],
  [24, 56],
  [136, 56],
  [50, 36],
  [112, 38],
];

export function plazaTrees(shape: MapShape): { x: number; y: number }[] {
  return TREES.map(([dx, dy]) => ({
    x: shape.x + (dx / 160) * shape.w,
    y: shape.y + (dy / 72) * shape.h,
  }));
}
