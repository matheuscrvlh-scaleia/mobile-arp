import { memo } from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle, Defs, G, Path, Pattern, Rect, Text as SvgText } from "react-native-svg";
import type { MapShape } from "@/contracts/directory";
import { fonts, useTheme } from "@/design";
import { type MapColors, mapColors } from "../lib/map-colors";
import { type CanvasSize, type MapFloor, plazaTrees, VIEW } from "../lib/map-geometry";

/* Desenho estático do andar (MapSvg/mapBlock do protótipo), no viewBox do recorte.
   Fica separado dos pinos: selecionar uma loja não redesenha o andar. */

const VIEWBOX = `${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`;
const label = {
  fontFamily: fonts.bold,
  fontSize: 9,
} as const;

function Shape({ shape, parkId, m }: { shape: MapShape; parkId: string; m: MapColors }) {
  const { x, y, w, h } = shape;
  const rx = (r: number) => Math.min(r, w / 2, h / 2);
  const text = shape.label.toUpperCase();
  switch (shape.kind) {
    case "plaza":
      return (
        <G>
          <Rect x={x} y={y} width={w} height={h} rx={rx(34)} fill={m.plaza} />
          {plazaTrees(shape).map((t) => (
            <G key={`${t.x}-${t.y}`}>
              <Circle cx={t.x} cy={t.y} r={7} fill={m.tree} />
              <Circle cx={t.x - 2} cy={t.y - 2} r={3} fill={m.treeLight} />
            </G>
          ))}
          {text ? (
            <SvgText
              {...label}
              x={x + w / 2}
              y={y + 16}
              textAnchor="middle"
              fill={m.greenLabel}
              letterSpacing={0.6}
            >
              {text}
            </SvgText>
          ) : null}
        </G>
      );
    case "parking":
      return (
        <G>
          <Rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={rx(16)}
            fill={`url(#${parkId})`}
            stroke={m.parkingStroke}
          />
          {text ? (
            <SvgText {...label} x={x + 14} y={y + 22} fill={m.parkingLabel} letterSpacing={0.6}>
              {text}
            </SvgText>
          ) : null}
        </G>
      );
    case "bridge":
      return (
        <Rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={rx(4)}
          fill={m.bridge}
          stroke={m.bridgeStroke}
          strokeDasharray="3 3"
        />
      );
    case "void":
      return (
        <G>
          <Rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={rx(28)}
            fill="none"
            stroke={m.voidStroke}
            strokeWidth={1.4}
            strokeDasharray="5 5"
          />
          {text ? (
            <SvgText
              {...label}
              fontSize={8}
              x={x + w / 2}
              y={y + h - 9}
              textAnchor="middle"
              fill={m.faintLabel}
              letterSpacing={0.6}
            >
              {text}
            </SvgText>
          ) : null}
        </G>
      );
    case "terrace":
      return (
        <G>
          <Rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={rx(18)}
            fill={m.terrace}
            stroke={m.terraceStroke}
            strokeWidth={1.4}
            strokeDasharray="6 5"
          />
          {text ? (
            <SvgText {...label} x={x + 14} y={y + 24} fill={m.greenLabel} letterSpacing={0.6}>
              {text}
            </SvgText>
          ) : null}
        </G>
      );
    default:
      return (
        <G>
          <Rect x={x} y={y + 4} width={w} height={h} rx={rx(18)} fill={m.blockShadow} />
          <Rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={rx(18)}
            fill={m.block}
            stroke={m.blockStroke}
            strokeWidth={1.2}
          />
          {text ? (
            <SvgText {...label} x={x + 14} y={y + 24} fill={m.blockLabel} letterSpacing={0.8}>
              {text}
            </SvgText>
          ) : null}
        </G>
      );
  }
}

/** "Você está aqui" na entrada (só no térreo, como no protótipo). A pulsação fica na camada dos pinos. */
function Entrance({ m }: { m: MapColors }) {
  return (
    <G>
      <Path d="M150 438 H210" stroke={m.voidStroke} strokeWidth={2} strokeDasharray="3 4" />
      <Circle cx={180} cy={432} r={8} fill={m.you} stroke={m.youRing} strokeWidth={3} />
      <SvgText fontFamily={fonts.bold} fontSize={10} x={196} y={436} fill={m.youText}>
        Você está aqui
      </SvgText>
      <SvgText {...label} x={164} y={436} textAnchor="end" fill={m.faintLabel} letterSpacing={0.6}>
        ENTRADA
      </SvgText>
    </G>
  );
}

type Props = { floor: MapFloor; canvas: CanvasSize; ground: boolean };

/** memo: selecionar/filtrar muda só os pinos; o desenho do andar não é refeito. */
export const FloorLayer = memo(function FloorLayer({ floor, canvas, ground }: Props) {
  const m = mapColors[useTheme().scheme];
  const parkId = `park-${floor.id}`;
  return (
    <Svg
      width={canvas.width}
      height={canvas.height}
      viewBox={VIEWBOX}
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <Pattern
          id={parkId}
          width={9}
          height={9}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <Rect width={9} height={9} fill={m.parkingBase} />
          <Rect width={3} height={9} fill={m.parkingStripe} />
        </Pattern>
      </Defs>
      {floor.layout.map((shape, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: o desenho do andar não tem id por forma
        <Shape key={i} shape={shape} parkId={parkId} m={m} />
      ))}
      {ground ? <Entrance m={m} /> : null}
    </Svg>
  );
});

/**
 * Quadriculado de fundo (pattern grid do protótipo), do tamanho da área visível e
 * fora do zoom: um SVG do tamanho do desenho ampliado pesaria muito na memória.
 */
export const MapGrid = memo(function MapGrid({
  width,
  height,
  k,
}: {
  width: number;
  height: number;
  k: number;
}) {
  const m = mapColors[useTheme().scheme];
  const cell = 14 * k;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="map-grid" width={cell} height={cell} patternUnits="userSpaceOnUse">
          <Path d={`M${cell} 0H0V${cell}`} fill="none" stroke={m.grid} strokeWidth={0.7 * k} />
        </Pattern>
      </Defs>
      <Rect width={width} height={height} fill="url(#map-grid)" />
    </Svg>
  );
});
