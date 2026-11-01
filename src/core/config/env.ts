import Constants from "expo-constants";

/** URL base da API do ERP, sem barra no fim (ex.: https://api.arp.com.br). */
function readApiUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error("EXPO_PUBLIC_API_URL não definida. Copie .env.example para .env.local.");
  }
  return raw.replace(/\/+$/, "");
}

export const env = {
  apiUrl: readApiUrl(),
  appVersion: Constants.expoConfig?.version ?? "0.0.0",
  /** Projeto do EAS: sem ele não há token do Expo Push. */
  easProjectId:
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId || null,
} as const;
