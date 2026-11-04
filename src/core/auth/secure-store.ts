/*
 * Cofre dos tokens. No aparelho é o expo-secure-store (Keychain/Keystore); no
 * web o Metro pega o secure-store.web.ts (o módulo nativo não existe lá).
 */
export { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
