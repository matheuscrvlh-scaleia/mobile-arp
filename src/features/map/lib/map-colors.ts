/* Cores do desenho do mapa (SVG do andar, quadriculado e "você está aqui") por tema.
   Claro = valores do protótipo (MapSvg/mapBlock); escuro = planta noturna: fundo quase preto,
   blocos um degrau acima com contorno visível e rótulos que passam ~4:1. Pura: sem React. */
import { darkPalette, lightPalette, type ThemeScheme } from "@/design/theme/palettes";

export type MapColors = {
  /** Fundo da tela do mapa (atrás do quadriculado). */
  bg: string;
  /** Linhas do quadriculado. */
  grid: string;

  /** Bloco de lojas (forma padrão). */
  block: string;
  blockStroke: string;
  /** Sombra chapada de 4px embaixo do bloco. */
  blockShadow: string;
  blockLabel: string;

  /** Praça com árvores. */
  plaza: string;
  tree: string;
  treeLight: string;
  /** Rótulo verde da praça e do terraço. */
  greenLabel: string;

  /** Estacionamento listrado (pattern a 45°). */
  parkingBase: string;
  parkingStripe: string;
  parkingStroke: string;
  parkingLabel: string;

  /** Ponte (tracejada). */
  bridge: string;
  bridgeStroke: string;

  /** Vão (só contorno tracejado), linha da entrada e rótulos "apagados". */
  voidStroke: string;
  faintLabel: string;

  /** Terraço (tracejado verde). */
  terrace: string;
  terraceStroke: string;

  /** "Você está aqui": ponto, aro, texto e onda. */
  you: string;
  youRing: string;
  youText: string;

  /** Contorno extra do pino (separa cores de marca escuras do fundo noturno). */
  pinEdge: string | undefined;
};

export const mapColors: Record<ThemeScheme, MapColors> = {
  light: {
    bg: "#eef0eb",
    grid: "#e2e6df",
    block: lightPalette.bg,
    blockStroke: "#dde1d9",
    blockShadow: "rgba(20, 30, 20, 0.05)",
    blockLabel: "#9aa198",
    plaza: lightPalette.brand100,
    tree: "#b7e1bf",
    treeLight: "#cdebd2",
    greenLabel: lightPalette.brand700,
    parkingBase: "#f5f2ee",
    parkingStripe: "#ece7e1",
    parkingStroke: "#e2ddd6",
    parkingLabel: "#a39d95",
    bridge: lightPalette.bg,
    bridgeStroke: "#d9ddd5",
    voidStroke: "#c9cfc5",
    faintLabel: "#a6ada2",
    terrace: lightPalette.brand50,
    terraceStroke: "#b9e0c0",
    you: lightPalette.brand700,
    youRing: lightPalette.onMedia,
    youText: lightPalette.brand700,
    pinEdge: undefined,
  },
  dark: {
    bg: "#111511",
    grid: "#1a1f1a",
    block: darkPalette.surfaceRaised,
    blockStroke: "#323a32",
    blockShadow: "rgba(0, 0, 0, 0.35)",
    blockLabel: "#848b82",
    plaza: darkPalette.brand100,
    tree: "#2b5434",
    treeLight: "#3a6e45",
    greenLabel: darkPalette.brandText,
    parkingBase: darkPalette.surface,
    parkingStripe: "#212621",
    parkingStroke: "#2b312b",
    parkingLabel: "#7a8178",
    bridge: darkPalette.surfaceRaised,
    bridgeStroke: darkPalette.borderStrong,
    voidStroke: darkPalette.borderStrong,
    faintLabel: "#727970",
    terrace: darkPalette.brand50,
    terraceStroke: "#2c5535",
    // verde vivo: o brand700 some sobre o fundo noturno
    you: darkPalette.brand,
    // aro branco nos dois temas (como o ponto de localização dos mapas do sistema)
    youRing: darkPalette.onMedia,
    youText: darkPalette.brandText,
    pinEdge: "0 0 0 1px rgba(255, 255, 255, 0.16), 0 4px 10px -4px rgba(0, 0, 0, 0.7)",
  },
};
