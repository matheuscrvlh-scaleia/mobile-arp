/**
 * Web (react-native-web): mesma API do kv.ts sobre o localStorage. O
 * expo-sqlite no web exige wasm e SharedArrayBuffer (cabeçalhos COOP/COEP),
 * que não cabem num iframe comum. Sem localStorage (modo privado, bloqueado),
 * vira memória da aba.
 */

const memory = new Map<string, string>();

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function getSync(key: string): string | null {
  try {
    const s = storage();
    return s ? s.getItem(key) : (memory.get(key) ?? null);
  } catch {
    return memory.get(key) ?? null;
  }
}

function setSync(key: string, value: string): void {
  try {
    const s = storage();
    if (s) s.setItem(key, value);
    else memory.set(key, value);
  } catch {
    memory.set(key, value);
  }
}

function removeSync(key: string): void {
  memory.delete(key);
  try {
    storage()?.removeItem(key);
  } catch {
    // sem localStorage: a memória já foi limpa
  }
}

export const kv = {
  get: (key: string): Promise<string | null> => Promise.resolve(getSync(key)),
  set: (key: string, value: string): Promise<void> => Promise.resolve(setSync(key, value)),
  remove: (key: string): Promise<void> => Promise.resolve(removeSync(key)),
  getSync,
  setSync,
};
