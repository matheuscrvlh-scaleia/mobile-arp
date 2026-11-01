import { isRunningInExpoGo } from "expo";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { appApi } from "@/core/api/app-api";
import { isSignedIn, providePushToken, useSession } from "@/core/auth/session";
import { env } from "@/core/config/env";
import { kv } from "@/core/storage/kv";
// Só a paleta (pura; não o índice do design, que traz os componentes).
import { lightPalette } from "@/design/theme/palettes";

/*
 * Push remoto (Expo Push → ERP). Regras:
 * - nunca pede permissão sozinho: quem chama `askPushPermission()` é um momento
 *   com contexto (fim do cadastro, primeiro cupom pego, interruptor do perfil);
 * - registra o token só com conta, permissão, aparelho físico e projeto EAS;
 * - no máximo 1 registro por dia para o mesmo token e conta;
 * - Expo Go no Android não tem push remoto: tudo vira no-op (lembretes locais seguem).
 */

const CHANNEL_ID = "default";
/** Mesma cor do plugin expo-notifications no app.json (brand). Cor da marca: não segue o tema. */
const BRAND = lightPalette.brand;
const REGISTERED_KEY = "arp.push.registered";
const ENABLED_KEY = "arp.push.enabled";
const RESYNC_MS = 24 * 60 * 60 * 1000;

export type PushPermission = "granted" | "askable" | "blocked";
export type RemotePushSupport =
  | "ok"
  | "unsupported-platform"
  | "simulator"
  | "expo-go"
  | "no-project";

/** Se este ambiente consegue receber push remoto (local funciona em todos). */
export function remotePushSupport(): RemotePushSupport {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return "unsupported-platform";
  if (!Device.isDevice) return "simulator";
  if (Platform.OS === "android" && isRunningInExpoGo()) return "expo-go";
  if (!env.easProjectId) return "no-project";
  return "ok";
}

/** Preferência local do visitante (interruptor do perfil). Ligada por padrão. */
export const pushPreference = {
  isEnabled: (): boolean => kv.getSync(ENABLED_KEY) !== "0",
  set(on: boolean): void {
    kv.setSync(ENABLED_KEY, on ? "1" : "0");
    if (on) void syncPushToken();
    else forgetPushRegistration();
  },
};

let handlerSet = false;

/** Como mostrar notificações com o app aberto. Idempotente. */
export function configureNotificationHandler(): void {
  if (handlerSet) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // Push remoto com a preferência desligada: não interrompe quem está usando o app.
      const { trigger } = notification.request;
      const remote = !!trigger && "type" in trigger && trigger.type === "push";
      const show = !remote || pushPreference.isEnabled();
      return {
        shouldShowBanner: show,
        shouldShowList: show,
        shouldPlaySound: show,
        shouldSetBadge: false,
      };
    },
  });
}

let channel: Promise<void> | null = null;

/** Canal "default" (o Expo Push usa este id). No Android 13+ precisa existir antes do pedido. */
export function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return Promise.resolve();
  channel ??= Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Ofertas e avisos",
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: BRAND,
    vibrationPattern: [0, 250, 250, 250],
  })
    .then(() => undefined)
    .catch(() => {
      channel = null;
    });
  return channel;
}

export async function getPushPermission(): Promise<PushPermission> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return "granted";
    return current.canAskAgain ? "askable" : "blocked";
  } catch {
    return "blocked";
  }
}

/**
 * Pede a permissão do sistema (se ainda puder) e registra o token. Chame só
 * num momento com contexto. true = notificações permitidas.
 */
export async function askPushPermission(): Promise<boolean> {
  await ensureAndroidChannel();
  try {
    let status = await Notifications.getPermissionsAsync();
    if (!status.granted && status.canAskAgain) {
      status = await Notifications.requestPermissionsAsync();
    }
    if (!status.granted) return false;
  } catch {
    return false;
  }
  kv.setSync(ENABLED_KEY, "1");
  void syncPushToken();
  return true;
}

interface Registration {
  token: string;
  visitorId: string;
  at: number;
}

function readRegistration(): Registration | null {
  try {
    const raw = kv.getSync(REGISTERED_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (
      value &&
      typeof value === "object" &&
      "token" in value &&
      "visitorId" in value &&
      "at" in value &&
      typeof value.token === "string" &&
      typeof value.visitorId === "string" &&
      typeof value.at === "number"
    ) {
      return { token: value.token, visitorId: value.visitorId, at: value.at };
    }
  } catch {
    // registro corrompido: registra de novo
  }
  return null;
}

/**
 * Esquece o último registro (ao sair): a próxima conta registra o token na hora.
 * O ERP desvincula o aparelho no próprio logout (o token vai junto: ver providePushToken).
 */
export function forgetPushRegistration(): void {
  void kv.remove(REGISTERED_KEY).catch(() => undefined);
}

// O logout leva o token deste aparelho para o ERP desvincular o push da conta.
providePushToken(() => readRegistration()?.token ?? null);

/**
 * Notificações desligadas no app: desvincula o token da conta no ERP (para de
 * receber push com o app fechado) e esquece o registro local. Melhor esforço.
 */
export async function unregisterPushToken(): Promise<void> {
  const registration = readRegistration();
  forgetPushRegistration();
  if (registration && isSignedIn()) {
    await appApi.pushTokens.remove({ token: registration.token }).catch(() => undefined);
  }
}

let syncing: Promise<void> | null = null;

/**
 * Registra o token do aparelho na conta, se der. Sem efeito quando não há
 * conta, permissão, aparelho físico ou projeto EAS. `tokenChanged` ignora o
 * limite diário (o sistema trocou o token).
 */
export function syncPushToken(options: { tokenChanged?: boolean } = {}): Promise<void> {
  syncing ??= doSync(options.tokenChanged ?? false).finally(() => {
    syncing = null;
  });
  return syncing;
}

async function doSync(tokenChanged: boolean): Promise<void> {
  const projectId = env.easProjectId;
  if (!isSignedIn() || !pushPreference.isEnabled() || remotePushSupport() !== "ok" || !projectId) {
    return;
  }
  const visitorId = useSession.getState().visitor?.id ?? "";
  const last = readRegistration();
  // Mesmo dono registrado há menos de um dia: nem pede o token de novo (é uma chamada de rede).
  if (!tokenChanged && last && last.visitorId === visitorId && Date.now() - last.at < RESYNC_MS) {
    return;
  }
  try {
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    await ensureAndroidChannel();
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await appApi.pushTokens.register({
      token,
      platform: Platform.OS === "ios" ? "ios" : "android",
    });
    kv.setSync(REGISTERED_KEY, JSON.stringify({ token, visitorId, at: Date.now() }));
  } catch (error) {
    // Melhor esforço: tenta de novo na próxima abertura ou login.
    if (__DEV__) console.warn("[push] não foi possível registrar o token", error);
  }
}
