import type { MerchantClaim } from "@/contracts/app/merchant";
import { isApiError } from "@/core/api/errors";
import { sheet, toast } from "@/design";
import { haptic } from "@/shared/lib/haptics";
import { fetchClaim, useLookupClaim } from "../api/merchant";
import { claimProblem, failureFromError, type ValidationFailure } from "../lib/validation";
import { ConfirmClaimSheet } from "../sheets/confirm-claim";

export type ValidateHandlers = {
  /** O código foi usado. */
  onRedeemed?: (claim: MerchantClaim) => void;
  /** Terminou sem usar: recusa, "Cancelar", painel fechado ou falha de rede. */
  onDismissed?: () => void;
};

function showFailure(failure: ValidationFailure, handlers: ValidateHandlers): void {
  haptic.error();
  if (failure.kind === "toast") {
    toast.show(failure.title, failure.icon, { haptic: "none" });
    handlers.onDismissed?.();
    return;
  }
  sheet.message({
    icon: failure.icon,
    iconBackground: "dangerSoft",
    title: failure.title,
    text: failure.text,
    actions: [{ label: "Entendi" }],
    onClose: handlers.onDismissed,
  });
}

/** Uso recusado: em "já usado", busca a hora do uso para a mensagem (melhor esforço). */
async function redeemFailure(error: unknown, code: string): Promise<ValidationFailure> {
  let redeemedAt: string | null = null;
  if (isApiError(error) && error.code === "CLAIM_ALREADY_REDEEMED") {
    redeemedAt = await fetchClaim(code).then(
      (claim) => claim.redeemedAt,
      () => null,
    );
  }
  return failureFromError(error, { now: Date.now(), redeemedAt });
}

function openConfirm(claim: MerchantClaim, handlers: ValidateHandlers): void {
  // `handedOff`: o resultado já foi entregue (sucesso ou outro painel no lugar).
  let handedOff = false;
  let closed = false;
  sheet.open(
    (api) => (
      <ConfirmClaimSheet
        claim={claim}
        api={api}
        onRedeemed={(used) => {
          handedOff = true;
          if (!closed) api.close();
          haptic.success();
          toast.show(`Código ${used.code} validado!`, "circle-check", { haptic: "none" });
          handlers.onRedeemed?.(used);
        }}
        onFailed={(error) => {
          handedOff = true;
          void redeemFailure(error, claim.code).then((failure) => showFailure(failure, handlers));
        }}
      />
    ),
    {
      onClose: () => {
        closed = true;
        if (!handedOff) handlers.onDismissed?.();
      },
    },
  );
}

/**
 * Validação em dois passos (evita engano no caixa): `check(code)` consulta o código e abre o
 * painel de confirmação; só o "Confirmar uso" gasta o código. Recusas abrem um painel com o
 * motivo (com vibração de erro); falha de rede vira aviso curto.
 */
export function useValidateCode() {
  const lookup = useLookupClaim();

  /** false = já havia uma consulta em andamento (nada foi feito; os handlers não serão chamados). */
  const check = (code: string, handlers: ValidateHandlers = {}): boolean => {
    if (lookup.isPending) return false;
    lookup.mutateAsync(code).then(
      (claim) => {
        const problem = claimProblem(claim, Date.now());
        if (problem) {
          showFailure(problem, handlers);
          return;
        }
        haptic.light();
        openConfirm(claim, handlers);
      },
      (error: unknown) => showFailure(failureFromError(error, { now: Date.now() }), handlers),
    );
    return true;
  };

  return { check, checking: lookup.isPending };
}
