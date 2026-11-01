/* Estado dos overlays (painel e aviso). Fora do React para poder ser chamado de qualquer lugar:
   handlers, mutations do react-query, interceptors da API. */
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { AccessibilityInfo } from "react-native";
import { createStore } from "zustand/vanilla";
import type { IconName } from "../components/Icon";

export type SheetApi = {
  /** Fecha o painel (anima a saída). */
  close: () => void;
  /** Fecha o painel e roda a ação — os botões do protótipo fecham o painel antes de agir. */
  closeThen: (fn: () => void) => () => void;
};

export type SheetContent = ReactNode | ((api: SheetApi) => ReactNode);

export type SheetOptions = {
  /** Tocar no fundo, arrastar para baixo e o voltar do Android fecham. Padrão true. */
  dismissible?: boolean;
  /** Conteúdo maior que a tela: rola, e o arrasto fica só na alça. */
  scrollable?: boolean;
  /** Chamado depois que a animação de saída termina. */
  onClose?: () => void;
};

export type SheetEntry = {
  id: number;
  content: SheetContent;
  options: SheetOptions;
  closing: boolean;
};

export type ToastEntry = { id: number; message: string; icon: IconName };

type OverlayState = { sheet: SheetEntry | null; toast: ToastEntry | null };

export const overlayStore = createStore<OverlayState>(() => ({ sheet: null, toast: null }));

let seq = 0;
/** Se o OverlayHost não estiver montado (ou a animação não avisar), libera o painel mesmo assim. */
const CLOSE_FALLBACK_MS = 600;
export const TOAST_MS = 2700;

function finishSheet(id: number) {
  const current = overlayStore.getState().sheet;
  if (!current || current.id !== id) return;
  overlayStore.setState({ sheet: null });
  current.options.onClose?.();
}

function closeSheet() {
  const current = overlayStore.getState().sheet;
  if (!current || current.closing) return;
  overlayStore.setState({ sheet: { ...current, closing: true } });
  const { id } = current;
  setTimeout(() => finishSheet(id), CLOSE_FALLBACK_MS);
}

export const sheet = {
  open(content: SheetContent, options: SheetOptions = {}): number {
    // Substituir um painel conta como fechá-lo (libera a trava do leitor, descarta ação pendente…).
    const replaced = overlayStore.getState().sheet;
    replaced?.options.onClose?.();
    seq += 1;
    overlayStore.setState({ sheet: { id: seq, content, options, closing: false } });
    return seq;
  },
  close: closeSheet,
  closeThen: (fn: () => void) => (): void => {
    closeSheet();
    fn();
  },
  isOpen(): boolean {
    const s = overlayStore.getState().sheet;
    return !!s && !s.closing;
  },
  /** Uso interno do Sheet: a animação de saída terminou. */
  _finish: finishSheet,
};

export const sheetApi: SheetApi = { close: sheet.close, closeThen: sheet.closeThen };

/** Ícones que contam como "deu certo" e ganham o toque leve de vibração. */
const SUCCESS_ICONS = new Set<string>([
  "circle-check",
  "check",
  "ticket-check",
  "copy-check",
  "calendar-check",
  "heart",
  "award",
  "trophy",
  "party-popper",
]);

export type ToastOptions = {
  /** `auto` vibra leve nos ícones de sucesso; `light`/`none` forçam. */
  haptic?: "auto" | "light" | "none";
};

export const toast = {
  show(message: string, icon: IconName = "circle-check", options: ToastOptions = {}): void {
    seq += 1;
    const id = seq;
    overlayStore.setState({ toast: { id, message, icon } });
    setTimeout(() => {
      if (overlayStore.getState().toast?.id === id) overlayStore.setState({ toast: null });
    }, TOAST_MS);

    const haptic = options.haptic ?? "auto";
    if (haptic === "light" || (haptic === "auto" && SUCCESS_ICONS.has(icon))) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    AccessibilityInfo.announceForAccessibility(message);
  },
  hide(): void {
    overlayStore.setState({ toast: null });
  },
};
