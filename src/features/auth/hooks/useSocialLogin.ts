import { useEffect, useState } from "react";
import type { Session, SocialProvider } from "@/contracts/app/auth";
import { errorMessage } from "@/core/api/errors";
import { sheet, toast } from "@/design";
import { haptic } from "@/shared/lib/haptics";
import { useSocialLoginMutation } from "../api/auth";
import {
  isAppleSignInAvailable,
  isGoogleSignInAvailable,
  type ProviderCredential,
  ProviderSignInError,
  providerCredential,
} from "../api/social-providers";
import { idTokenEmail, PROVIDER_LABEL, socialFailure } from "../lib/social-errors";
import { openOtherLoginSheet } from "../sheets/other-login";
import { openSocialTermsSheet } from "../sheets/social-terms";
import type { AuthKind } from "./useCompleteAuth";

export type SocialAvailability = { google: boolean; apple: boolean };

type Extra = { acceptTerms?: true; marketingOptIn?: boolean };

type Settled<T> = { ok: true; value: T } | { ok: false; error: unknown };

/** Promessa → resultado, sem try/catch dentro do hook (o React Compiler não compila value blocks em try). */
function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  return promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
}

function socialBody(provider: SocialProvider, credential: ProviderCredential, extra: Extra) {
  return {
    provider,
    idToken: credential.idToken,
    ...(credential.nonce ? { nonce: credential.nonce } : {}),
    ...(credential.name ? { name: credential.name } : {}),
    ...extra,
  };
}

export type UseSocialLoginOptions = {
  /** `useCompleteAuth()` da tela (sessão + saída das telas de conta). */
  completeAuth: (session: Session, kind: AuthKind) => Promise<void>;
  /** O e-mail já tem conta com senha: levar ao Entrar com ele preenchido. */
  onUsePassword: (email: string | null) => void;
};

/**
 * Entrar com Google/Apple: abre o login do provedor, manda o id_token para o
 * ERP e trata as recusas (termos de conta nova, e-mail de outro método, conta
 * bloqueada, provedor desligado). Sucesso = o mesmo fim do login por e-mail.
 */
export function useSocialLogin({ completeAuth, onUsePassword }: UseSocialLoginOptions) {
  const social = useSocialLoginMutation();
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [apple, setApple] = useState(false);
  const google = isGoogleSignInAvailable();

  useEffect(() => {
    let alive = true;
    void isAppleSignInAvailable().then((ok) => {
      if (alive) setApple(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  const available: SocialAvailability = { google, apple };

  const submit = async (
    provider: SocialProvider,
    credential: ProviderCredential,
    extra: Extra,
  ): Promise<void> => {
    setBusy(provider);
    const result = await settle(social.mutateAsync(socialBody(provider, credential, extra)));
    setBusy(null);
    if (!result.ok) {
      handleFailure(provider, credential, result.error);
      return;
    }
    // Só conta nova passa pelos termos: é cadastro (convite de notificações garantido).
    await completeAuth(result.value, extra.acceptTerms ? "signup" : "login");
  };

  const handleFailure = (
    provider: SocialProvider,
    credential: ProviderCredential,
    error: unknown,
  ): void => {
    const label = PROVIDER_LABEL[provider];
    const failure = socialFailure(error);
    switch (failure.kind) {
      case "terms":
        openSocialTermsSheet(provider, ({ marketingOptIn }) => {
          void submit(provider, credential, { acceptTerms: true, marketingOptIn });
        });
        return;
      case "other-login":
        haptic.error();
        openOtherLoginSheet(failure.method, idTokenEmail(credential.idToken), {
          onPassword: onUsePassword,
          onProvider: (next) => void start(next),
          isAvailable: (p) => available[p],
        });
        return;
      case "invalid":
        haptic.error();
        toast.show(`Não conseguimos confirmar sua conta ${label}. Tente de novo.`, "circle-alert", {
          haptic: "none",
        });
        return;
      case "blocked":
        haptic.error();
        sheet.message({
          icon: "lock",
          iconBackground: "dangerSoft",
          title: "Conta bloqueada",
          text: failure.message,
          actions: [{ label: "Entendi" }],
        });
        return;
      case "unavailable":
        toast.show(`Login com ${label} indisponível no momento.`, "circle-alert", {
          haptic: "light",
        });
        return;
      default:
        toast.show(errorMessage(error), "circle-alert", { haptic: "light" });
    }
  };

  const start = async (provider: SocialProvider): Promise<void> => {
    if (busy !== null) return;
    setBusy(provider);
    const result = await settle(providerCredential(provider));
    if (!result.ok) {
      setBusy(null);
      const message =
        result.error instanceof ProviderSignInError
          ? result.error.message
          : `Não deu para entrar com ${PROVIDER_LABEL[provider]}. Tente de novo.`;
      toast.show(message, "circle-alert", { haptic: "light" });
      return;
    }
    const credential = result.value;
    if (!credential) {
      setBusy(null); // cancelou no provedor
      return;
    }
    await submit(provider, credential, {});
  };

  return { available, busy, start };
}
