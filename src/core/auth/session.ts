import { create } from "zustand";
import type { Session, VisitorProfile } from "@/contracts/app/auth";
import { appApi } from "@/core/api/app-api";
import { registerAuthBridge } from "@/core/api/http";
import { kv } from "@/core/storage/kv";
import { createTokenKeeper } from "./token-keeper";

/*
 * Sessão do visitante. Tokens com o guardião (`token-keeper`); perfil no kv,
 * para abrir o app já logado e sem rede. Guardar o access evita um refresh a
 * cada abertura (alivia o ERP em rajadas de push).
 */

const VISITOR_KEY = "arp.visitor";

export type SessionStatus = "restoring" | "guest" | "signedIn";

interface SessionState {
  status: SessionStatus;
  visitor: VisitorProfile | null;
}

export const useSession = create<SessionState>(() => ({ status: "restoring", visitor: null }));

/** signedOut: "user" = tocou em Sair; "expired" = a API recusou a sessão (vencida, revogada, bloqueada). */
export type SessionEvent = { type: "signedIn" } | { type: "signedOut"; reason: "user" | "expired" };
type Listener = (event: SessionEvent) => void;
const listeners = new Set<Listener>();

/** Avisado quando a conta entra ou sai (cache, push e lembretes reagem a isso). */
export function onSessionChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const emit = (event: SessionEvent) => {
  for (const listener of listeners) listener(event);
};

function persistVisitor(visitor: VisitorProfile | null): Promise<void> {
  return visitor ? kv.set(VISITOR_KEY, JSON.stringify(visitor)) : kv.remove(VISITOR_KEY);
}

/** Token de push deste aparelho (registrado por core/notifications): vai no logout para o ERP desvincular. */
let pushTokenOf: () => string | null = () => null;
export function providePushToken(getter: () => string | null): void {
  pushTokenOf = getter;
}

function signedOutLocally(): void {
  useSession.setState({ status: "guest", visitor: null });
  void persistVisitor(null).catch(() => undefined);
}

const keeper = createTokenKeeper<Session>({
  storageKey: "arp",
  refresh: (refreshToken) => appApi.auth.refresh({ refreshToken }),
  revoke: (refreshToken) => appApi.auth.logout({ refreshToken }),
  onSession: (session) => {
    useSession.setState({ visitor: session.visitor });
    void persistVisitor(session.visitor).catch(() => undefined);
  },
  onExpired: () => {
    signedOutLocally();
    emit({ type: "signedOut", reason: "expired" });
  },
});

registerAuthBridge(keeper);

export const sessionActions = {
  /** Chamado uma vez na abertura do app. Não depende de rede. */
  async restore(): Promise<void> {
    const [hasSession, cachedVisitor] = await Promise.all([
      keeper.restore(),
      kv.get(VISITOR_KEY).catch(() => null),
    ]);
    if (!hasSession) {
      useSession.setState({ status: "guest", visitor: null });
      return;
    }
    let visitor: VisitorProfile | null = null;
    try {
      visitor = cachedVisitor ? (JSON.parse(cachedVisitor) as VisitorProfile) : null;
    } catch {
      visitor = null;
    }
    useSession.setState({ status: "signedIn", visitor });
  },

  /** Renova já (em paralelo com a abertura) se o access guardado venceu. Falha silenciosa. */
  warmUp(): void {
    keeper.warmUp();
  },

  /** Depois de login, cadastro, login social ou nova senha. */
  async signIn(session: Session): Promise<void> {
    await keeper.apply(session);
    useSession.setState({ status: "signedIn" });
    emit({ type: "signedIn" });
  },

  /** Atualiza o perfil guardado (ex.: depois de PATCH /me ou GET /me). */
  setVisitor(visitor: VisitorProfile): void {
    useSession.setState({ visitor });
    void persistVisitor(visitor).catch(() => undefined);
  },

  /** Sai da conta: revoga o refresh e desvincula o push na API (melhor esforço) e limpa o aparelho. */
  async signOut(): Promise<void> {
    const pushToken = pushTokenOf();
    const refreshToken = await keeper.clear();
    signedOutLocally();
    emit({ type: "signedOut", reason: "user" });
    if (refreshToken) {
      await appApi.auth
        .logout({ refreshToken, ...(pushToken ? { pushToken } : {}) })
        .catch(() => undefined);
    }
  },
};

export const isSignedIn = (): boolean => useSession.getState().status === "signedIn";
