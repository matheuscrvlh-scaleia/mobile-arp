import { useNavigation, useRouter } from "expo-router";
import { useEffect } from "react";
import type { Session } from "@/contracts/app/auth";
import { pendingAction } from "@/core/auth/pending-action";
import { sessionActions } from "@/core/auth/session";
import { toast } from "@/design";
import { haptic } from "@/shared/lib/haptics";
import { firstName } from "@/shared/lib/names";
import { authExit } from "../lib/auth-exit";
import { onboarding } from "../lib/onboarding";
import { offerPushNotifications } from "../sheets/push-offer";

/**
 * Saída das telas de conta em andamento: a tela de conta que sai não é
 * abandono e, ao sair, roda a ação pendente (uma vez).
 */
let completing = false;

/** Se o evento "removed" não chegar (navegação recusada), roda a ação mesmo assim. */
const EXIT_FALLBACK_MS = 1500;
/** Espera o painel da ação pendente (se houver) antes de oferecer notificações. */
const PUSH_OFFER_DELAY_MS = 1200;

/** signup = conta nova (e-mail ou social); login = conta existente; reset = entrou com a senha nova. */
export type AuthKind = "signup" | "login" | "reset";

const WELCOME: Record<AuthKind, (name: string) => string> = {
  signup: (name) => `Conta criada. Boas-vindas, ${name}!`,
  login: (name) => `Boas-vindas de volta, ${name}!`,
  reset: (name) => `Senha nova salva. Boas-vindas de volta, ${name}!`,
};

/** Fim da saída: a pilha já voltou à tela de origem, então a ação acontece lá. */
function finishExit(): void {
  if (!completing) return;
  completing = false;
  pendingAction.run();
}

type Router = ReturnType<typeof useRouter>;

/** Sai das telas de conta (e do primeiro acesso) de volta para onde o visitante estava. */
function exitAuthFlow(router: Router, routeNames: readonly string[]): void {
  completing = true;
  const plan = authExit(routeNames);
  if (plan.kind === "dismiss") {
    router.dismiss(plan.count);
  } else {
    // Só telas de conta na pilha (boas-vindas, link direto): as abas entram no lugar delas.
    if (router.canDismiss()) router.dismissAll();
    router.replace("/");
  }
  setTimeout(finishExit, EXIT_FALLBACK_MS);
}

/**
 * Fim do primeiro acesso (Nossa história → Regras da ARP, Fase 2): sai do
 * cadastro e dos textos e roda a ação pendente (ex.: pegar o cupom).
 */
export function useFinishOnboarding() {
  const navigation = useNavigation();
  const router = useRouter();
  return () => {
    exitAuthFlow(router, navigation.getState()?.routes.map((route) => route.name) ?? []);
    setTimeout(() => {
      void offerPushNotifications({ force: true });
    }, PUSH_OFFER_DELAY_MS);
  };
}

/**
 * Fecha o fluxo de conta depois de entrar/cadastrar: guarda a sessão, sai das
 * telas de conta de volta para onde o visitante estava, dá as boas-vindas e,
 * DEPOIS que a tela de conta saiu da pilha, roda a ação que ele tentou fazer
 * antes (pegar cupom, ler o QR, favoritar...). A navegação do expo-router é
 * uma fila processada no render seguinte: rodar a ação logo após o `dismiss`
 * a faria acontecer ainda sobre o cadastro.
 * Também descarta a ação pendente se ele desistir (voltar sem entrar).
 *
 * `keepPendingOnLeave`: telas que ficam por cima do "Entrar" (nova senha) —
 * voltar delas cai no Entrar, que continua na pilha: não é desistir.
 */
export function useCompleteAuth({ keepPendingOnLeave = false } = {}) {
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    const off = navigation.addListener("removed", (event) => {
      if (completing) {
        finishExit();
        return;
      }
      // Trocar cadastro ↔ entrar não é desistir.
      if (keepPendingOnLeave || event.data.action.type === "REPLACE") return;
      pendingAction.clear();
    });
    // "removed" chega depois do cleanup do efeito: a inscrição sai no microtask seguinte.
    return () => queueMicrotask(off);
  }, [navigation, keepPendingOnLeave]);

  return async (session: Session, kind: AuthKind): Promise<void> => {
    await sessionActions.signIn(session);
    onboarding.markDone();
    haptic.success();

    toast.show(WELCOME[kind](firstName(session.visitor.name)), "party-popper", { haptic: "none" });

    // Conta nova: primeiro a história e as regras da ARP; a saída acontece no fim delas.
    if (kind === "signup") {
      router.push({ pathname: "/texto/[key]", params: { key: "history", boasVindas: "1" } });
      return;
    }

    exitAuthFlow(router, navigation.getState()?.routes.map((route) => route.name) ?? []);
    setTimeout(() => {
      void offerPushNotifications();
    }, PUSH_OFFER_DELAY_MS);
  };
}
