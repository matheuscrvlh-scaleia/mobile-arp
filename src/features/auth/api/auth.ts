import { useMutation } from "@tanstack/react-query";
import type {
  ForgotPasswordBody,
  LoginBody,
  RegisterInput,
  ResetPasswordBody,
  SocialLoginInput,
} from "@/contracts/app/auth";
import { appApi } from "@/core/api/app-api";

/** Cadastro. Recusas: CONFLICT (e-mail já cadastrado), VALIDATION_ERROR (fieldErrors), RATE_LIMITED. */
export function useRegisterMutation() {
  return useMutation({ mutationFn: (body: RegisterInput) => appApi.auth.register(body) });
}

/** Login. Recusas: INVALID_CREDENTIALS, VALIDATION_ERROR, RATE_LIMITED. */
export function useLoginMutation() {
  return useMutation({ mutationFn: (body: LoginBody) => appApi.auth.login(body) });
}

/**
 * Google/Apple (id_token). Recusas: INVALID_CREDENTIALS, EMAIL_USES_OTHER_LOGIN
 * (`details.provider`), TERMS_REQUIRED, FORBIDDEN, SERVICE_UNAVAILABLE, RATE_LIMITED.
 */
export function useSocialLoginMutation() {
  return useMutation({ mutationFn: (body: SocialLoginInput) => appApi.auth.social(body) });
}

/** Pede o código de nova senha. Sempre 204; SERVICE_UNAVAILABLE sem e-mail configurado no ERP. */
export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (body: ForgotPasswordBody) => appApi.auth.forgotPassword(body),
  });
}

/** Código + nova senha → sessão. Código ruim/vencido: VALIDATION_ERROR em `code`. */
export function useResetPasswordMutation() {
  return useMutation({ mutationFn: (body: ResetPasswordBody) => appApi.auth.resetPassword(body) });
}
