import * as Haptics from "expo-haptics";

/* Vibração do app num lugar só (falha silenciosa: aparelho sem motor, web). */
const ignore = () => undefined;

export const haptic = {
  /** Ação confirmada pelo servidor (cupom garantido, selo ganho). */
  success: () =>
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore),
  /** Recusa/erro de uma ação. */
  error: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(ignore),
  /** Toque leve (QR lido, alternância). */
  light: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignore),
  /** Troca de seleção (aba, andar, chip). */
  select: () => void Haptics.selectionAsync().catch(ignore),
};
