import Storage from "expo-sqlite/kv-store";

/**
 * Chave-valor persistente (SQLite) para dados não sensíveis: cache das
 * consultas e preferências. Tokens ficam no SecureStore (auth/token-store).
 */
export const kv = {
  get: (key: string): Promise<string | null> => Storage.getItem(key),
  set: (key: string, value: string): Promise<void> => Storage.setItem(key, value),
  remove: (key: string): Promise<void> => Storage.removeItem(key).then(() => undefined),
  getSync: (key: string): string | null => Storage.getItemSync(key),
  setSync: (key: string, value: string): void => Storage.setItemSync(key, value),
};
