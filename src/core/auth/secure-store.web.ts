import { kv } from "@/core/storage/kv";

/*
 * Web (react-native-web): não há cofre do sistema, então os tokens ficam no
 * localStorage (via kv.web). Menos protegido que o Keychain/Keystore: aceitável
 * para a versão web de demonstração, nunca para dados além da sessão.
 */

export const getItemAsync = (key: string): Promise<string | null> => kv.get(key);
export const setItemAsync = (key: string, value: string): Promise<void> => kv.set(key, value);
export const deleteItemAsync = (key: string): Promise<void> => kv.remove(key);
