import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * URL base da API do ERP, sem barra no fim (ex.: https://api.arp.com.br).
 * No web pode vir relativa ("/arp-api", proxy do host na mesma origem): vira
 * absoluta com a origem da página, porque quem monta URL assume absoluta.
 */
function readApiUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error("EXPO_PUBLIC_API_URL não definida. Copie .env.example para .env.local.");
  }
  const url = raw.replace(/\/+$/, "");
  if (Platform.OS === "web" && url.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${url}`;
  }
  return url;
}

export const env = {
  apiUrl: readApiUrl(),
  appVersion: Constants.expoConfig?.version ?? "0.0.0",
  /** Projeto do EAS: sem ele não há token do Expo Push. */
  easProjectId:
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId || null,
} as const;
