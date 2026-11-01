/* Paletas semânticas do app (claro = protótipo mockup-mobile-arp/src/app.css; escuro = projeto
   próprio, mesma marca). Pura: sem React nem React Native. Tabela de migração em docs/tema.md. */
import type { Tone } from "@/contracts";
import { cssAngle } from "./color";

export type ThemeScheme = "light" | "dark";

/* Cores ------------------------------------------------------------------ */

export type Palette = {
  /* Fundos, do mais fundo ao mais alto */
  /** Fundo da página (antigo `white` como fundo de tela). */
  bg: string;
  /** Levemente afastado do fundo: linha pressionada, campo só-leitura (antigo `sand2`). */
  surfaceSunken: string;
  /** Cartão, campo, chip e botão "soft" (antigo `card`). */
  surface: string;
  /** Um degrau acima de `surface`: blocos e trilhos sobre cartão (antigo `sand`). */
  surfaceStrong: string;
  /** Elevado: painel (sheet), polegar do segmented, botão/pílula "white" (antigo `white` de
      elemento com sombra). No escuro é mais claro que `surface`. */
  surfaceRaised: string;

  /* Texto */
  /** Texto principal (antigo `ink` como texto). */
  text: string;
  /** Texto de leitura um pouco mais suave (antigo `ink2`). */
  textSecondary: string;
  /** Texto secundário (antigo `muted`). */
  textMuted: string;
  /** Placeholder, desabilitado, "fechado" (antigos `lockedInk`, `closed`). Não use em texto
      que precisa ser lido. */
  textSubtle: string;

  /* Linhas */
  /** Divisor e borda de campo (antigo `line`). */
  border: string;
  /** Borda que precisa aparecer mais; pontos inativos (antigos `dotOff`, `switchOff`). */
  borderStrong: string;
  /** Linha tracejada (.dashed) sobre a página/cartão. */
  dashed: string;
  /** Linha tracejada sobre `chrome` ou tom escuro (.dashed.light). */
  dashedOnChrome: string;

  /* Marca */
  brand: string;
  brand300: string;
  brand600: string;
  /** Verde escuro para preenchimentos e gradientes (igual nos dois temas). Texto → `brandText`. */
  brand700: string;
  brand900: string;
  /** Tint de marca bem leve (fundo de destaque). Escurecido no tema escuro. */
  brand50: string;
  /** Tint de marca (fundo da pílula "brand", bordas de callout). Escurecido no tema escuro. */
  brand100: string;
  /** Texto/ícone verde sobre `bg`, `surface`, `brand50` e `brand100` (antigo `brand700` como texto). */
  brandText: string;
  /** Texto/ícone sobre `brand` (ink nos dois temas). */
  onBrand: string;

  /* Contraste invertido: botão "dark", pílula "dark", chip/contador ligado */
  /** Escuro no tema claro, CLARO no tema escuro (antigo `ink` como fundo de botão/pílula/chip). */
  inverse: string;
  onInverse: string;

  /* Superfícies escuras fixas: barra de abas, aviso (toast), cartão/hero escuro, busca do mapa */
  /** Escura nos dois temas (um pouco mais clara no escuro, com fio claro: `chromeBorder`). */
  chrome: string;
  /** Fio de 1px que separa `chrome` do fundo quase preto (transparente no tema claro). */
  chromeBorder: string;
  onChrome: string;
  /** Texto/ícone secundário sobre chrome (antigos `onDarkMuted`, `navIdle`). */
  onChromeMuted: string;
  /** Mais apagado ainda (antigo `onDarkFaint`). */
  onChromeSubtle: string;
  /** Aba ativa da barra (pílula clara dentro do chrome). */
  chromeActive: string;
  onChromeActive: string;

  /* Mídia: sobre foto, gradiente de marca ou tom colorido vivo */
  /** Texto/ícone sobre foto ou cor viva: sempre branco. */
  onMedia: string;
  /** Trilho/linha branca translúcida sobre mídia (antigo `lineLight`). */
  onMediaLine: string;
  /** Vidro sobre foto (.glass). */
  glass: string;
  /** Preto: fundo da câmera, base de véus e sombras (`withAlpha(scrim, .4)`). */
  scrim: string;
  /** Papel do QR/código: branco nos dois temas (leitores precisam de fundo claro). */
  paper: string;
  onPaper: string;

  /* Estado */
  /** Laranja (clay): favorito, alerta, urgência. */
  danger: string;
  /** Fundo suave do alerta (antigo `claySoft`). */
  dangerSoft: string;
  /** Texto/ícone de alerta sobre `bg` ou `dangerSoft` (antigo `clayInk`). */
  dangerText: string;

  /* Componentes */
  /** Véu atrás do painel (antigo `backdrop`). */
  overlay: string;
  skeleton: string;
  /** Trilho do interruptor desligado. */
  switchOff: string;
  /** Trilho do interruptor desligado sobre chrome (antigo `switchOffDark`). */
  switchOffOnChrome: string;
  /** Bolinha do interruptor: branca nos dois temas. */
  switchKnob: string;
  /** Selo ainda não conquistado (antigos `locked` / `lockedInk`). */
  locked: string;
  onLocked: string;
};

export type ThemeColor = keyof Palette;

const INK = "#141714";
const WHITE = "#ffffff";

const shared = {
  brand: "#58c069",
  brand300: "#8be09a",
  brand600: "#46a956",
  brand700: "#2f7d3d",
  brand900: "#173d1f",
  onBrand: INK,
  onChrome: WHITE,
  onChromeSubtle: "rgba(255, 255, 255, 0.45)",
  onChromeActive: INK,
  dashedOnChrome: "rgba(255, 255, 255, 0.18)",
  onMedia: WHITE,
  onMediaLine: "rgba(255, 255, 255, 0.25)",
  glass: "rgba(255, 255, 255, 0.22)",
  scrim: "#000000",
  paper: WHITE,
  onPaper: "#000000",
  switchOffOnChrome: "#454a45",
  switchKnob: WHITE,
} as const satisfies Partial<Palette>;

/** Tema claro: os valores do protótipo. */
export const lightPalette: Palette = {
  ...shared,
  bg: WHITE,
  surfaceSunken: "#f6f3f0",
  surface: "#f3f1ee",
  surfaceStrong: "#eee9e5",
  surfaceRaised: WHITE,
  text: INK,
  textSecondary: "#262a26",
  textMuted: "#686d67",
  textSubtle: "#b0aaa3",
  border: "#e7e3de",
  borderStrong: "#d6d2cd",
  dashed: "rgba(20, 23, 20, 0.14)",
  brand50: "#eef8ef",
  brand100: "#d8efdc",
  brandText: "#2f7d3d",
  inverse: INK,
  onInverse: WHITE,
  chrome: INK,
  chromeBorder: "rgba(255, 255, 255, 0)",
  onChromeMuted: "rgba(255, 255, 255, 0.55)",
  chromeActive: WHITE,
  danger: "#e0734a",
  dangerSoft: "#fde4da",
  dangerText: "#b4502b",
  overlay: "rgba(12, 14, 12, 0.45)",
  skeleton: "#f3f1ee",
  switchOff: "#d6d2cd",
  locked: "#e3dfda",
  onLocked: "#b0aaa3",
};

/**
 * Tema escuro: fundo quase preto puxado para o verde da marca, superfícies em degraus claros,
 * texto quase branco. `textMuted` passa AA (4.5:1) sobre bg, surface e surfaceRaised.
 */
export const darkPalette: Palette = {
  ...shared,
  bg: "#0e110e",
  surfaceSunken: "#141814",
  surface: "#191d19",
  surfaceStrong: "#252a25",
  surfaceRaised: "#20251f",
  text: "#f1f3f0",
  textSecondary: "#d3d8d2",
  textMuted: "#959c93",
  textSubtle: "#646b63",
  border: "#272c27",
  borderStrong: "#3a413a",
  dashed: "rgba(255, 255, 255, 0.14)",
  brand50: "#142116",
  brand100: "#1d3523",
  brandText: "#7fd48d",
  inverse: "#eef1ed",
  onInverse: INK,
  chrome: "#1c211c",
  chromeBorder: "rgba(255, 255, 255, 0.08)",
  onChromeMuted: "rgba(255, 255, 255, 0.6)",
  chromeActive: "#eef1ed",
  danger: "#ec8560",
  dangerSoft: "#3a2219",
  dangerText: "#f19a78",
  overlay: "rgba(0, 0, 0, 0.6)",
  skeleton: "#1c211c",
  switchOff: "#3a413a",
  locked: "#262b26",
  onLocked: "#5f665e",
};

export const palettes: Record<ThemeScheme, Palette> = { light: lightPalette, dark: darkPalette };

/* Tons de cartão (.tone-green|ink|clay|sand|deep) ------------------------ */

export type ToneSpec = {
  /** Gradiente de fundo (135deg no CSS). Para `ink` é sólido + brilho radial verde. */
  gradient: readonly [string, string];
  /** Brilho radial no canto (só `ink`: radial-gradient at 90% 0%). */
  radialGlow: string | null;
  /** Fio de 1px para o cartão não sumir no fundo (só tons escuros no tema escuro). */
  border: string | null;
  fg: string;
  /** Texto secundário (opacity .8/.85 no CSS). */
  fgMuted: string;
  barTrack: string;
  barFill: string;
  /** .cp-logo / .glass-tile */
  tile: string;
  /** borda tracejada do canhoto (.cp-stub) */
  stubLine: string;
};

const onColorTone = {
  border: null,
  fg: WHITE,
  fgMuted: "rgba(255, 255, 255, 0.82)",
  barTrack: "rgba(255, 255, 255, 0.25)",
  barFill: WHITE,
  tile: "rgba(255, 255, 255, 0.22)",
  stubLine: "rgba(255, 255, 255, 0.35)",
} as const;

const vividTones = {
  green: { gradient: ["#5fc86f", "#2f7d3d"], radialGlow: null, ...onColorTone },
  clay: { gradient: ["#ee8a5f", "#c95a32"], radialGlow: null, ...onColorTone },
  deep: { gradient: ["#2d6b39", "#173d1f"], radialGlow: null, ...onColorTone },
} as const satisfies Partial<Record<Tone, ToneSpec>>;

export const lightTones: Record<Tone, ToneSpec> = {
  ...vividTones,
  ink: { gradient: [INK, INK], radialGlow: "rgba(88, 192, 105, 0.35)", ...onColorTone },
  sand: {
    gradient: ["#f1ece7", "#e4ddd5"],
    radialGlow: null,
    border: null,
    fg: INK,
    fgMuted: "rgba(20, 23, 20, 0.75)",
    barTrack: "rgba(20, 23, 20, 0.1)",
    barFill: INK,
    tile: "rgba(255, 255, 255, 0.7)",
    stubLine: "rgba(20, 23, 20, 0.15)",
  },
};

/** Escuro: os tons vivos continuam iguais; `ink` vira chrome com fio; `sand` vira areia escura. */
export const darkTones: Record<Tone, ToneSpec> = {
  ...vividTones,
  ink: {
    ...onColorTone,
    gradient: [darkPalette.chrome, darkPalette.chrome],
    radialGlow: "rgba(88, 192, 105, 0.3)",
    border: darkPalette.chromeBorder,
  },
  sand: {
    gradient: ["#2c2824", "#211e1b"],
    radialGlow: null,
    border: "rgba(255, 255, 255, 0.06)",
    fg: darkPalette.text,
    fgMuted: "rgba(241, 243, 240, 0.75)",
    barTrack: "rgba(255, 255, 255, 0.12)",
    barFill: darkPalette.text,
    tile: "rgba(255, 255, 255, 0.08)",
    stubLine: "rgba(255, 255, 255, 0.16)",
  },
};

export const paletteTones: Record<ThemeScheme, Record<Tone, ToneSpec>> = {
  light: lightTones,
  dark: darkTones,
};

/* Gradientes (iguais nos dois temas: são a marca) ------------------------ */

export const themeGradients = {
  /** .avatar, .slide.promo, .mcard (135deg brand → brand-700) */
  brand: { colors: [shared.brand, shared.brand700] as const, ...cssAngle(135) },
  /** .tk-progress i (90deg) */
  brandBar: { colors: [shared.brand, shared.brand700] as const, ...cssAngle(90) },
  /** .tk-screen (180deg) */
  ticketScreen: { colors: [shared.brand, "#3f9f50"] as const, ...cssAngle(180) },
} as const;

export type Gradients = typeof themeGradients;

/* Sombras ---------------------------------------------------------------- */

type Shadow = { boxShadow: string };

export type ShadowName =
  | "iconBtnWhite"
  | "segThumb"
  | "knob"
  | "lockBubble"
  | "toast"
  | "nav"
  | "cardDark"
  | "ticket"
  | "lift"
  | "float"
  | "dayOn"
  | "dateBadge"
  | "hairline"
  | "photoRing"
  | "photoRingDark";

export type Shadows = Record<ShadowName, Shadow>;

/* boxShadow do RN (nova arquitetura): mesma sintaxe do CSS, iOS e Android, inclusive `inset`. */
export const lightShadows: Shadows = {
  iconBtnWhite: { boxShadow: "0 6px 16px -8px rgba(0, 0, 0, 0.25)" },
  segThumb: { boxShadow: "0 4px 12px -4px rgba(0, 0, 0, 0.15)" },
  knob: { boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)" },
  lockBubble: { boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)" },
  toast: { boxShadow: "0 14px 30px -10px rgba(0, 0, 0, 0.5)" },
  /** .nav (barra de abas) */
  nav: { boxShadow: "0 20px 40px -14px rgba(20, 23, 20, 0.6)" },
  cardDark: { boxShadow: "0 26px 40px -20px rgba(20, 23, 20, 0.7)" },
  ticket: { boxShadow: "0 30px 50px -24px rgba(16, 60, 24, 0.55)" },
  lift: { boxShadow: "0 16px 30px -12px rgba(0, 0, 0, 0.4)" },
  float: { boxShadow: "0 14px 30px -12px rgba(0, 0, 0, 0.5)" },
  dayOn: { boxShadow: "0 14px 24px -12px rgba(0, 0, 0, 0.6)" },
  dateBadge: { boxShadow: "0 8px 20px -10px rgba(0, 0, 0, 0.3)" },
  /** Fio interno de 1px em fotos/logos (.store-row img, .wl-item img…) */
  hairline: { boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.06)" },
  /** Foto redonda com aro claro (.dcard .logo, .store-card img) */
  photoRing: { boxShadow: "0 0 0 3px #ffffff, 0 8px 16px -8px rgba(0, 0, 0, 0.35)" },
  /** O mesmo aro sobre fundo escuro (tom ink/deep) */
  photoRingDark: { boxShadow: "0 0 0 3px rgba(255, 255, 255, 0.14)" },
};

/* No escuro a sombra preta quase não aparece sobre fundo quase preto: sombras mais fortes e,
   nos elementos elevados, um fio claro interno (inset 1px) que faz o papel da borda. */
const EDGE = "inset 0 0 0 1px rgba(255, 255, 255, 0.07)";
export const darkShadows: Shadows = {
  iconBtnWhite: { boxShadow: `0 6px 16px -8px rgba(0, 0, 0, 0.7), ${EDGE}` },
  segThumb: { boxShadow: `0 4px 12px -4px rgba(0, 0, 0, 0.6), ${EDGE}` },
  knob: { boxShadow: "0 2px 6px rgba(0, 0, 0, 0.45)" },
  lockBubble: { boxShadow: `0 2px 6px rgba(0, 0, 0, 0.5), ${EDGE}` },
  toast: { boxShadow: `0 14px 30px -10px rgba(0, 0, 0, 0.85), ${EDGE}` },
  nav: {
    boxShadow: "0 20px 40px -14px rgba(0, 0, 0, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
  },
  cardDark: {
    boxShadow: "0 26px 40px -20px rgba(0, 0, 0, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
  },
  ticket: { boxShadow: "0 30px 50px -24px rgba(0, 0, 0, 0.85)" },
  lift: { boxShadow: "0 16px 30px -12px rgba(0, 0, 0, 0.75)" },
  float: { boxShadow: `0 14px 30px -12px rgba(0, 0, 0, 0.85), ${EDGE}` },
  dayOn: { boxShadow: "0 14px 24px -12px rgba(0, 0, 0, 0.9)" },
  dateBadge: { boxShadow: "0 8px 20px -10px rgba(0, 0, 0, 0.7)" },
  hairline: { boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.08)" },
  photoRing: { boxShadow: "0 0 0 3px #2a302a, 0 8px 16px -8px rgba(0, 0, 0, 0.7)" },
  photoRingDark: { boxShadow: "0 0 0 3px rgba(255, 255, 255, 0.14)" },
};

export const paletteShadows: Record<ThemeScheme, Shadows> = {
  light: lightShadows,
  dark: darkShadows,
};

/** Sombra colorida dos selos: `0 12px 22px -12px <gradientTo>` (igual nos dois temas). */
export function sealShadow(color: string): Shadow {
  return { boxShadow: `0 12px 22px -12px ${color}` };
}
