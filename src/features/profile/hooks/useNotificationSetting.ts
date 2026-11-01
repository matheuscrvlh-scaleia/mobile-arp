import { useEffect, useState } from "react";
import { AppState } from "react-native";
import {
  askPushPermission,
  getPushPermission,
  type PushPermission,
  pushPreference,
  unregisterPushToken,
} from "@/core/notifications/push";
import { toast } from "@/design";
import {
  openNotificationsBlockedSheet,
  openNotificationsPausedSheet,
} from "../sheets/profile-sheets";

/**
 * Interruptor "Notificações" do perfil: ligado = preferência ligada e
 * permissão do sistema concedida. Relê a permissão ao voltar dos ajustes.
 * Desligar desvincula este aparelho da conta no ERP; ligar registra de novo.
 */
export function useNotificationSetting() {
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const [enabled, setEnabled] = useState(pushPreference.isEnabled);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const refresh = () => {
      void getPushPermission().then(setPermission);
    };
    refresh();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, []);

  const toggle = async (next: boolean): Promise<void> => {
    if (busy) return;
    if (!next) {
      // Primeiro desvincula no ERP (lê o token registrado antes de a preferência esquecê-lo):
      // com o app fechado também para de chegar. Melhor esforço, sem segurar o interruptor.
      void unregisterPushToken();
      pushPreference.set(false);
      setEnabled(false);
      openNotificationsPausedSheet();
      return;
    }
    setBusy(true);
    pushPreference.set(true);
    setEnabled(true);
    const granted = await askPushPermission();
    const now = await getPushPermission();
    setPermission(now);
    setBusy(false);
    if (granted) toast.show("Notificações ativadas", "bell-ring", { haptic: "light" });
    else if (now === "blocked") openNotificationsBlockedSheet();
  };

  return { value: enabled && permission === "granted", busy, toggle };
}
