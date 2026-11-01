/* Tokens do app do visitante, transcritos de mockup-mobile-arp/src/app.css (:root e classes). */
import { Geist_400Regular } from "@expo-google-fonts/geist/400Regular";
import { Geist_500Medium } from "@expo-google-fonts/geist/500Medium";
import { Geist_600SemiBold } from "@expo-google-fonts/geist/600SemiBold";
import { Geist_700Bold } from "@expo-google-fonts/geist/700Bold";
import { Geist_800ExtraBold } from "@expo-google-fonts/geist/800ExtraBold";
import { Geist_900Black } from "@expo-google-fonts/geist/900Black";
import { themes } from "./theme/theme";

export { cssAngle, withAlpha } from "./theme/color";
export { sealShadow, type ToneSpec } from "./theme/palettes";

/* Cores ------------------------------------------------------------------ */

/*
 * As cores vêm do TEMA (claro/escuro): `createStyles((t) => ...)`, `useColors()`,
 * `useTheme()` — veja docs/tema.md e src/design/theme. Não há paleta estática.
 */

/** Gradientes da marca (iguais nos dois temas; prefira `useTheme().gradients`). */
export const gradients = themes.light.gradients;

/* Espaços, raios, layout ------------------------------------------------- */

export const space = {
  0: 0,
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  22: 22,
  24: 24,
  28: 28,
  32: 32,
  40: 40,
} as const;

export const radii = {
  xs: 8, // .urgent
  sm: 14, // .segm button, .rule .r-ic
  md: 18, // .segm, .date-badge
  lg: 22, // .wallet-strip, .store-row, .sheet-ic
  xl: 24, // .rules, .wl-item, .mini-cp
  card: 28, // .cp, .dcard, .slide
  cardLg: 32, // .mcard, .cd-body
  sheet: 34, // .sheet (topo)
  pill: 13, // .pill
  chip: 20, // .chip
  search: 26, // .search
  button: 29, // .btn
  round: 999,
} as const;

export const layout = {
  /** .pad — margem lateral padrão das telas */
  gutter: 20,
  /** .top — distância do conteúdo para a status bar */
  topGap: 8,
  /** .nav-head — o cabeçalho fica um pouco mais alto que o conteúdo */
  navHeadGap: 6,
  /** .sec-h margin: 28px 20px 14px */
  sectionTop: 28,
  sectionBottom: 14,
} as const;

/** Barra de abas flutuante (.nav): 70 de altura, 14 das laterais, acima do home indicator. */
export const TAB_BAR_HEIGHT = 70;
export const TAB_BAR_SIDE = 14;
/** `.app.native .nav { bottom: max(env(safe-area-inset-bottom), 14px) }` */
export const TAB_BAR_MIN_BOTTOM = 14;
/** .bottom-space (120) − barra (70) − distância do fundo (26) */
export const TAB_BAR_CLEARANCE_GAP = 24;

export function tabBarBottomOffset(safeBottom: number): number {
  return Math.max(safeBottom, TAB_BAR_MIN_BOTTOM);
}

/** hitSlop para alvos menores que 44pt */
export const hitSlop = {
  sm: { top: 8, bottom: 8, left: 8, right: 8 },
  md: { top: 12, bottom: 12, left: 12, right: 12 },
} as const;

/* Fontes ----------------------------------------------------------------- */

/** Passe para `useFonts` do expo-font. Importa só os 6 pesos usados (a raiz do pacote traz 18). */
export const GEIST_FONTS = {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
  Geist_900Black,
} as const;

export const fonts = {
  regular: "Geist_400Regular",
  medium: "Geist_500Medium",
  semibold: "Geist_600SemiBold",
  bold: "Geist_700Bold",
  extrabold: "Geist_800ExtraBold",
  black: "Geist_900Black",
} as const;

export type FontFamily = (typeof fonts)[keyof typeof fonts];

/** Pesos que aparecem no CSS. O protótipo carrega Geist 400–900 em passos de 100, então o
    navegador arredonda 550/650/750/850 para cima (regra de font matching do CSS); aqui também. */
export type FontWeight = 400 | 500 | 550 | 600 | 650 | 700 | 750 | 800 | 850 | 900;

export function fontFamily(weight: FontWeight): FontFamily {
  if (weight <= 400) return fonts.regular;
  if (weight <= 500) return fonts.medium;
  if (weight <= 600) return fonts.semibold;
  if (weight <= 700) return fonts.bold;
  if (weight <= 800) return fonts.extrabold;
  return fonts.black;
}

/** letter-spacing do CSS em `em` → px para um tamanho. */
export function tracking(size: number, em: number): number {
  return Math.round(size * em * 100) / 100;
}

type TypeSpec = {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textTransform?: "uppercase";
};

function t(
  fontSize: number,
  weight: FontWeight,
  em = 0,
  lineHeight = Math.round(fontSize * 1.3),
): TypeSpec {
  return {
    fontFamily: fontFamily(weight),
    fontSize,
    lineHeight,
    letterSpacing: tracking(fontSize, em),
  };
}

export const typography = {
  /** .title */
  title: t(32, 800, -0.04, 34),
  /** .hello-t h1 / .sheet h3 */
  h1: t(24, 800, -0.035, 28),
  /** .sec-h h2 */
  h2: t(19, 750, -0.025, 24),
  /** .nav-head h3 / .empty b */
  h3: t(17, 700, 0, 22),
  /** .dcard h4 / .ev-row b */
  h4: t(16, 750, -0.02, 20),
  body: t(15, 400, 0, 21),
  bodyStrong: t(15, 650, 0, 20),
  small: t(13, 400, 0, 18),
  smallStrong: t(13, 600, 0, 18),
  caption: t(12, 600, 0, 16),
  /** .side-label / .tk-timer small */
  label: { ...t(11, 700, 0.08, 14), textTransform: "uppercase" },
  button: t(16, 650, 0, 20),
} as const satisfies Record<string, TypeSpec>;

export type TypographyVariant = keyof typeof typography;

/* Movimento -------------------------------------------------------------- */

export const motion = {
  /** --ease: cubic-bezier(.2, .8, .2, 1). Curva pronta para o Reanimated em `easings.ease`. */
  ease: [0.2, 0.8, 0.2, 1],
  /** --spring: cubic-bezier(.3, 1.5, .5, 1) (passa do alvo e volta) */
  spring: [0.3, 1.5, 0.5, 1],
  press: 200,
  fast: 250,
  base: 300,
  slow: 450,
  /** escala ao pressionar: .icon-btn:active .92, .btn:active .97, cartões .98 */
  pressScale: { icon: 0.92, button: 0.97, card: 0.98 },
} as const;
