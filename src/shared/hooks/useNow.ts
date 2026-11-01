/* Relógio compartilhado: um timer por intervalo distinto (1 s para as contagens, 60 s para
   "hoje"/saudação…), cada um alinhado à virada do seu intervalo. Quem assina só 60 s não mantém
   o timer de 1 s ligado. Só roda enquanto há inscritos e pausa com o app em segundo plano. */
import { useCallback, useSyncExternalStore } from "react";
import { AppState, type AppStateStatus, type NativeEventSubscription } from "react-native";

const TICK_MS = 1000;
/** Folga caso o timer dispare adiantado: o valor já mudou de "balde" quando ele roda. */
const SLACK_MS = 5;

type Bucket = {
  step: number;
  listeners: Set<() => void>;
  /** Agora arredondado para baixo ao múltiplo de `step`. */
  value: number;
  timer: ReturnType<typeof setTimeout> | null;
};

const buckets = new Map<number, Bucket>();
let appStateSub: NativeEventSubscription | null = null;

const floorTo = (t: number, step: number) => Math.floor(t / step) * step;

/** Atualiza o valor do balde e avisa os inscritos só se ele mudou. */
function refresh(b: Bucket) {
  const next = floorTo(Date.now(), b.step);
  if (next === b.value) return;
  b.value = next;
  for (const l of b.listeners) l();
}

function schedule(b: Bucket) {
  b.timer = setTimeout(
    () => {
      refresh(b);
      schedule(b);
    },
    b.step - (Date.now() % b.step) + SLACK_MS,
  );
}

/** Lido na hora: o estado do boot ("inactive"/"background") pode ter mudado sem evento para nós. */
function isForeground(): boolean {
  const state = AppState.currentState;
  return !state || state === "active" || state === "unknown";
}

function start(b: Bucket) {
  if (b.timer || !isForeground()) return;
  refresh(b);
  schedule(b);
}

function stop(b: Bucket) {
  if (b.timer) clearTimeout(b.timer);
  b.timer = null;
}

function onAppState(next: AppStateStatus) {
  for (const b of buckets.values()) {
    if (next === "active") start(b);
    else stop(b);
  }
}

function subscribeTo(step: number, listener: () => void): () => void {
  let b = buckets.get(step);
  if (!b) {
    b = { step, listeners: new Set(), value: floorTo(Date.now(), step), timer: null };
    buckets.set(step, b);
    appStateSub ??= AppState.addEventListener("change", onAppState);
  }
  const bucket = b;
  bucket.listeners.add(listener);
  start(bucket);
  return () => {
    bucket.listeners.delete(listener);
    if (bucket.listeners.size > 0) return;
    stop(bucket);
    buckets.delete(step);
    if (buckets.size === 0) {
      appStateSub?.remove();
      appStateSub = null;
    }
  };
}

function snapshotOf(step: number): number {
  return buckets.get(step)?.value ?? floorTo(Date.now(), step);
}

/**
 * Agora (ms), arredondado para baixo ao múltiplo de `intervalMs` (mínimo 1000) e atualizado na
 * virada de cada intervalo: `useNow(60_000)` re-renderiza uma vez por minuto, no minuto cheio.
 */
export function useNow(intervalMs?: number): number {
  const step = Math.max(TICK_MS, Math.round(intervalMs ?? TICK_MS));
  const subscribe = useCallback((l: () => void) => subscribeTo(step, l), [step]);
  const getSnapshot = useCallback(() => snapshotOf(step), [step]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Leitura pontual do relógio, sem assinar (útil fora do React). */
export function getNow(): number {
  return Date.now();
}
