import { openMessageSheet } from "./SheetMessage";
import { sheet as coreSheet } from "./store";

export { OverlayHost } from "./OverlayHost";
export { Sheet } from "./Sheet";
export {
  SheetMessage,
  type SheetMessageAction,
  type SheetMessageOptions,
} from "./SheetMessage";
export {
  SheetActions,
  type SheetColor,
  SheetIcon,
  type SheetIconProps,
  SheetText,
  SheetTitle,
} from "./SheetParts";
export {
  overlayStore,
  type SheetApi,
  type SheetContent,
  type SheetOptions,
  type ToastOptions,
  toast,
} from "./store";
export { Toast } from "./Toast";

/**
 * Painel inferior: `sheet.open(content, options)`, `sheet.close()`, `sheet.closeThen(fn)`,
 * `sheet.isOpen()` e `sheet.message({ icon, title, text, actions })` para o painel de mensagem
 * (ícone + título + texto + botões). O `message` mora fora do store para ele seguir sem JSX.
 */
export const sheet = { ...coreSheet, message: openMessageSheet };
