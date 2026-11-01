import { kv } from "@/core/storage/kv";

/** Primeira abertura: a tela de boas-vindas aparece uma vez (até entrar ou explorar). */
const KEY = "arp.onboarded";

export const onboarding = {
  isDone: (): boolean => kv.getSync(KEY) === "1",
  markDone: (): void => kv.setSync(KEY, "1"),
};
