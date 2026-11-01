import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { AppState, Linking } from "react-native";
import { onSessionChange } from "@/core/auth/session";
import { openPath } from "@/navigation/navigate";
import { isWebUrl, toAppPath } from "./links";
import {
  configureNotificationHandler,
  ensureAndroidChannel,
  forgetPushRegistration,
  remotePushSupport,
  syncPushToken,
} from "./push";

/**
 * Push no root layout: canal Android, apresentação com o app aberto e
 * registro do token quando há conta (na abertura, ao entrar, ao voltar para o
 * app e quando o sistema troca o token). Nunca pede permissão aqui.
 * `ready` = sessão restaurada.
 */
export function usePushNotifications(ready: boolean): void {
  useEffect(() => {
    configureNotificationHandler();
    void ensureAndroidChannel();
  }, []);

  useEffect(() => {
    if (!ready) return;
    void syncPushToken();
    const offSession = onSessionChange((event) => {
      if (event.type === "signedIn") void syncPushToken();
      else forgetPushRegistration();
    });
    // Permissão dada nos ajustes do aparelho: registra ao voltar (limitado a 1x/dia).
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncPushToken();
    });
    const tokenSub =
      remotePushSupport() === "ok"
        ? Notifications.addPushTokenListener(() => void syncPushToken({ tokenChanged: true }))
        : null;
    return () => {
      offSession();
      appState.remove();
      tokenSub?.remove();
    };
  }, [ready]);
}

/** Respostas já tratadas (a última resposta continua disponível depois de tratada). */
const handled = new Set<string>();

function openResponse(response: Notifications.NotificationResponse): void {
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
  const { request } = response.notification;
  if (handled.has(request.identifier)) return;
  handled.add(request.identifier);
  Notifications.clearLastNotificationResponse();
  const raw = request.content.data?.url;
  const url = typeof raw === "string" ? raw : null;
  // Deep link do ERP (arp://cupom/x) ou caminho de lembrete local (/carteira/x). Vazio → Início.
  const path = toAppPath(url);
  if (path === "/" && isWebUrl(url)) {
    void Linking.openURL(url).catch(() => undefined);
    return;
  }
  openPath(path);
}

/**
 * Toque em notificação abre a tela do `data.url`, inclusive com o app fechado
 * (última resposta guardada pelo sistema). `ready` = navegador montado.
 */
export function useNotificationResponses(ready: boolean): void {
  useEffect(() => {
    if (!ready) return;
    const last = Notifications.getLastNotificationResponse();
    if (last) openResponse(last);
    const sub = Notifications.addNotificationResponseReceivedListener(openResponse);
    return () => sub.remove();
  }, [ready]);
}
