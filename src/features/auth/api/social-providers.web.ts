import type { SocialProvider } from "@/contracts/app/auth";

/*
 * Web (react-native-web): sem login nativo do Google e da Apple. Os botões
 * somem (disponível = false) e o login por e-mail segue igual. Mesma API do
 * social-providers.ts.
 */

export type ProviderCredential = {
  idToken: string;
  nonce?: string;
  name?: string;
};

export class ProviderSignInError extends Error {
  override readonly name = "ProviderSignInError";
  constructor(
    readonly provider: SocialProvider,
    message: string,
  ) {
    super(message);
  }
}

export function isGoogleSignInAvailable(): boolean {
  return false;
}

export function isAppleSignInAvailable(): Promise<boolean> {
  return Promise.resolve(false);
}

export function providerCredential(provider: SocialProvider): Promise<ProviderCredential | null> {
  return Promise.reject(
    new ProviderSignInError(provider, "Entre com e-mail e senha na versão web."),
  );
}

export const googleCredential = (): Promise<ProviderCredential | null> =>
  providerCredential("google");
export const appleCredential = (): Promise<ProviderCredential | null> =>
  providerCredential("apple");
