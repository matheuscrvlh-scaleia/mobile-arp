import { isRunningInExpoGo } from "expo";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import type { SocialProvider } from "@/contracts/app/auth";

/*
 * Ponte com o Google e a Apple: abre o login nativo e devolve o id_token que
 * vai para o POST /auth/social (quem valida é o ERP). null = o visitante
 * cancelou. Nenhum dado do provedor fica guardado no aparelho.
 *
 * Google: @react-native-google-signin/google-signin (API "Original", gratuita),
 * carregado só quando há client id para a plataforma; sem ele (ou no Expo Go,
 * que não tem o módulo nativo) o botão nem aparece.
 * Apple: expo-apple-authentication, só iOS, com nonce: o SHA-256 vai para a
 * Apple (fica no claim `nonce`) e o nonce cru vai para o ERP conferir.
 */

export type ProviderCredential = {
  idToken: string;
  /** Nonce cru (Apple). */
  nonce?: string;
  /** Nome que a Apple manda só no 1º login. */
  name?: string;
};

/** Erro do lado do provedor (sem token, Play Services ausente...): a tela mostra um aviso. */
export class ProviderSignInError extends Error {
  override readonly name = "ProviderSignInError";
  constructor(
    readonly provider: SocialProvider,
    message: string,
  ) {
    super(message);
  }
}

/* Google ------------------------------------------------------------------ */

// Lidas literalmente: o Metro só embute EXPO_PUBLIC_* acessadas assim.
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined;

type GoogleModule = typeof import("@react-native-google-signin/google-signin");

/** undefined = ainda não tentou; null = indisponível neste app/aparelho. */
let googleModule: GoogleModule | null | undefined;

/** Android usa o client id "Web" (audiência do id_token); iOS precisa do client id iOS. */
function googleConfigured(): boolean {
  if (Platform.OS === "android") return !!GOOGLE_WEB_CLIENT_ID;
  if (Platform.OS === "ios") return !!GOOGLE_IOS_CLIENT_ID;
  return false;
}

function loadGoogle(): GoogleModule | null {
  if (googleModule !== undefined) return googleModule;
  googleModule = null;
  if (!googleConfigured() || isRunningInExpoGo()) return null;
  try {
    // require tardio: sem client id (ou sem o módulo nativo no build) o import nem acontece.
    const mod = require("@react-native-google-signin/google-signin") as GoogleModule;
    mod.GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
    });
    googleModule = mod;
  } catch (error) {
    if (__DEV__) console.warn("[auth] Login com Google indisponível neste build", error);
  }
  return googleModule;
}

/** O botão do Google aparece? (client id configurado e módulo nativo no build). */
export function isGoogleSignInAvailable(): boolean {
  return loadGoogle() !== null;
}

export async function googleCredential(): Promise<ProviderCredential | null> {
  const mod = loadGoogle();
  if (!mod) throw new ProviderSignInError("google", "Login com Google indisponível no momento.");
  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = mod;
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;
    // Não precisamos da sessão do Google no aparelho: da próxima vez ele escolhe a conta de novo.
    void GoogleSignin.signOut().catch(() => undefined);
    const { idToken } = response.data;
    if (!idToken) {
      throw new ProviderSignInError("google", "O Google não confirmou sua conta. Tente de novo.");
    }
    return { idToken };
  } catch (error) {
    if (error instanceof ProviderSignInError) throw error;
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS) {
        return null;
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new ProviderSignInError(
          "google",
          "Atualize o Google Play Services para entrar com o Google.",
        );
      }
    }
    if (__DEV__) console.warn("[auth] Falha no login com Google", error);
    throw new ProviderSignInError("google", "Não deu para entrar com o Google. Tente de novo.");
  }
}

/* Apple ------------------------------------------------------------------- */

/** Sign in with Apple existe neste aparelho? (iOS 13+; nunca no Android). */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  return AppleAuthentication.isAvailableAsync().catch(() => false);
}

function randomNonce(): string {
  const bytes = Crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const NAME_MAX = 120;

export async function appleCredential(): Promise<ProviderCredential | null> {
  const nonce = randomNonce();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashed,
    });
    if (!credential.identityToken) {
      throw new ProviderSignInError("apple", "A Apple não confirmou sua conta. Tente de novo.");
    }
    const name = credential.fullName
      ? AppleAuthentication.formatFullName(credential.fullName).trim().slice(0, NAME_MAX)
      : "";
    return { idToken: credential.identityToken, nonce, ...(name ? { name } : {}) };
  } catch (error) {
    if (error instanceof ProviderSignInError) throw error;
    const code = (error as { code?: unknown } | null)?.code;
    if (code === "ERR_REQUEST_CANCELED") return null;
    if (__DEV__) console.warn("[auth] Falha no login com Apple", error);
    throw new ProviderSignInError("apple", "Não deu para entrar com a Apple. Tente de novo.");
  }
}

export function providerCredential(provider: SocialProvider): Promise<ProviderCredential | null> {
  return provider === "google" ? googleCredential() : appleCredential();
}
