/* Preferência de tema do visitante: "system" | "light" | "dark". Lida de forma síncrona na
   abertura (o primeiro quadro já sai no tema certo, sem piscar) e aplicada também no nativo
   (Appearance.setColorScheme) para teclado, alertas, seletores e a status bar acompanharem. */
import { Appearance } from "react-native";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { kv } from "@/core/storage/kv";
import type { ThemeScheme } from "./palettes";

export type ThemePreference = "system" | ThemeScheme;

export const THEME_PREFERENCE_KEY = "pref.theme";

function isPreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function readStored(): ThemePreference {
  try {
    const value = kv.getSync(THEME_PREFERENCE_KEY);
    return isPreference(value) ? value : "system";
  } catch {
    return "system";
  }
}

function applyNative(preference: ThemePreference): void {
  // RN 0.88: "unspecified" (ou "auto") remove a força e volta a seguir o sistema.
  Appearance.setColorScheme(preference === "system" ? "unspecified" : preference);
}

const initial = readStored();
// "system" já é o estado do nativo na abertura; só força quando o visitante escolheu.
if (initial !== "system") applyNative(initial);

export const themePreferenceStore = createStore<{ preference: ThemePreference }>(() => ({
  preference: initial,
}));

export function getThemePreference(): ThemePreference {
  return themePreferenceStore.getState().preference;
}

/** Troca e guarda a preferência. Pode ser chamada de fora do React. */
export function setThemePreference(preference: ThemePreference): void {
  if (preference === getThemePreference()) return;
  // nativo antes do estado: o próximo render já lê o esquema certo do Appearance
  applyNative(preference);
  themePreferenceStore.setState({ preference });
  kv.set(THEME_PREFERENCE_KEY, preference).catch(() => {});
}

/** `[preferência, trocar]` — para a tela de ajustes (Sistema / Claro / Escuro). */
export function useThemePreference(): readonly [
  ThemePreference,
  (preference: ThemePreference) => void,
] {
  const preference = useStore(themePreferenceStore, (s) => s.preference);
  return [preference, setThemePreference] as const;
}

/** Esquema efetivo: a escolha do visitante ou, em "system", o do aparelho. */
export function resolveScheme(
  preference: ThemePreference,
  system: string | null | undefined,
): ThemeScheme {
  if (preference !== "system") return preference;
  return system === "dark" ? "dark" : "light";
}
