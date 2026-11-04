import { kv } from "@/core/storage/kv";

/*
 * Web (react-native-web): sem push remoto (o Expo Push é só iOS/Android).
 * Mesma API do push.ts: a preferência do perfil continua guardada, mas a
 * permissão aparece como bloqueada e nada é registrado no ERP.
 */

const REGISTERED_KEY = "arp.push.registered";
const ENABLED_KEY = "arp.push.enabled";

export type PushPermission = "granted" | "askable" | "blocked";
export type RemotePushSupport =
  | "ok"
  | "unsupported-platform"
  | "simulator"
  | "expo-go"
  | "no-project";

export function remotePushSupport(): RemotePushSupport {
  return "unsupported-platform";
}

export const pushPreference = {
  isEnabled: (): boolean => kv.getSync(ENABLED_KEY) !== "0",
  set(on: boolean): void {
    kv.setSync(ENABLED_KEY, on ? "1" : "0");
  },
};

export function configureNotificationHandler(): void {}

export function ensureAndroidChannel(): Promise<void> {
  return Promise.resolve();
}

export async function getPushPermission(): Promise<PushPermission> {
  return "blocked";
}

export async function askPushPermission(): Promise<boolean> {
  return false;
}

export function forgetPushRegistration(): void {
  void kv.remove(REGISTERED_KEY).catch(() => undefined);
}

export async function unregisterPushToken(): Promise<void> {
  forgetPushRegistration();
}

export function syncPushToken(_options: { tokenChanged?: boolean } = {}): Promise<void> {
  return Promise.resolve();
}
