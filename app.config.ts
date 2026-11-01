import type { ConfigContext, ExpoConfig } from "expo/config";

/*
 * Variantes instaláveis lado a lado (APP_VARIANT): development | preview | production.
 * A base fica no app.json; aqui só o que muda por ambiente. A URL da API é
 * validada no build (falha no EAS, não no aparelho do visitante).
 */

type Variant = "development" | "preview" | "production";

const VARIANT = (process.env.APP_VARIANT ?? "development") as Variant;

const SUFFIX: Record<Variant, string> = {
  development: ".dev",
  preview: ".preview",
  production: "",
};

const NAME: Record<Variant, string> = {
  development: "ARP (dev)",
  preview: "ARP (teste)",
  production: "ARP",
};

function checkApiUrl(): void {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!url) throw new Error("EXPO_PUBLIC_API_URL não definida (veja .env.example e eas.json).");
  if (VARIANT !== "development" && !url.startsWith("https://")) {
    throw new Error(`EXPO_PUBLIC_API_URL precisa ser https em ${VARIANT}: ${url}`);
  }
}

/**
 * Login com Google (@react-native-google-signin/google-signin, sem Firebase).
 * Opcional: sem EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID o plugin fica de fora e o botão
 * do Google não aparece no iOS (no Android ele depende só do client id Web, lido
 * no app). O plugin só registra no iOS o URL scheme = client id iOS invertido
 * ("123-abc.apps.googleusercontent.com" → "com.googleusercontent.apps.123-abc").
 * O client id iOS é por bundle id: cada variante (.dev, .preview) precisa do seu.
 */
function googleSignInPlugin(): [string, { iosUrlScheme: string }] | null {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  if (!iosClientId) return null;
  const suffix = ".apps.googleusercontent.com";
  if (!iosClientId.endsWith(suffix)) {
    throw new Error(`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID inválido (deve terminar em ${suffix}).`);
  }
  const iosUrlScheme = `com.googleusercontent.apps.${iosClientId.slice(0, -suffix.length)}`;
  return ["@react-native-google-signin/google-signin", { iosUrlScheme }];
}

export default ({ config }: ConfigContext): ExpoConfig => {
  checkApiUrl();
  const id = `br.com.arp.visitante${SUFFIX[VARIANT]}`;
  const google = googleSignInPlugin();
  return {
    ...config,
    name: NAME[VARIANT],
    slug: config.slug ?? "arp-visitante",
    plugins: [...(config.plugins ?? []), ...(google ? [google] : [])],
    ios: { ...config.ios, bundleIdentifier: id },
    android: { ...config.android, package: id },
    extra: {
      ...config.extra,
      variant: VARIANT,
      eas: { projectId: process.env.EAS_PROJECT_ID ?? config.extra?.eas?.projectId ?? "" },
    },
  };
};
