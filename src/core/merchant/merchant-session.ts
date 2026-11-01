import { create } from "zustand";
import type { MerchantSession, MerchantStore } from "@/contracts/app/merchant";
import type { AuthUser } from "@/contracts/auth";
import { createTokenKeeper } from "@/core/auth/token-keeper";
import { kv } from "@/core/storage/kv";
import { merchantApi, registerMerchantAuth } from "./merchant-api";

/*
 * Sessão do lojista: tokens no SecureStore (prefixo próprio), perfil e loja
 * escolhida no kv. Independente da conta de visitante.
 */

const PROFILE_KEY = "arp.merchant.profile";

interface MerchantProfile {
  user: AuthUser;
  stores: MerchantStore[];
  allStores: boolean;
  /** Loja em que está agindo (lojista: a dele; admin: a escolhida). */
  storeId: string | null;
}

interface MerchantState {
  status: "restoring" | "signedOut" | "signedIn";
  profile: MerchantProfile | null;
}

export const useMerchantSession = create<MerchantState>(() => ({
  status: "restoring",
  profile: null,
}));

function save(profile: MerchantProfile | null): void {
  useMerchantSession.setState({ profile });
  void (profile ? kv.set(PROFILE_KEY, JSON.stringify(profile)) : kv.remove(PROFILE_KEY)).catch(
    () => undefined,
  );
}

function profileFrom(session: MerchantSession, previousStoreId: string | null): MerchantProfile {
  const keep = session.stores.some((s) => s.id === previousStoreId) ? previousStoreId : null;
  return {
    user: session.user,
    stores: session.stores,
    allStores: session.allStores,
    storeId: keep ?? (session.stores.length === 1 ? (session.stores[0]?.id ?? null) : null),
  };
}

const keeper = createTokenKeeper<MerchantSession>({
  storageKey: "arp.merchant",
  refresh: (refreshToken) => merchantApi.auth.refresh({ refreshToken }),
  revoke: (refreshToken) => merchantApi.auth.logout({ refreshToken }),
  // Renovação traz permissões e lojas atualizadas (perdeu o acesso → 403 → onExpired).
  onSession: (session) =>
    save(profileFrom(session, useMerchantSession.getState().profile?.storeId ?? null)),
  onExpired: () => {
    useMerchantSession.setState({ status: "signedOut" });
    save(null);
  },
});

registerMerchantAuth(keeper);

export const merchantSession = {
  async restore(): Promise<void> {
    const [has, raw] = await Promise.all([keeper.restore(), kv.get(PROFILE_KEY).catch(() => null)]);
    let profile: MerchantProfile | null = null;
    try {
      profile = raw ? (JSON.parse(raw) as MerchantProfile) : null;
    } catch {
      profile = null;
    }
    useMerchantSession.setState({
      status: has && profile ? "signedIn" : "signedOut",
      profile: has ? profile : null,
    });
  },

  async signIn(session: MerchantSession): Promise<void> {
    await keeper.apply(session);
    useMerchantSession.setState({ status: "signedIn" });
  },

  selectStore(storeId: string): void {
    const profile = useMerchantSession.getState().profile;
    if (profile) save({ ...profile, storeId });
  },

  /** Depois de trocar a senha obrigatória. */
  passwordChanged(): void {
    const profile = useMerchantSession.getState().profile;
    if (profile) save({ ...profile, user: { ...profile.user, mustChangePassword: false } });
  },

  async signOut(): Promise<void> {
    const refreshToken = await keeper.clear();
    useMerchantSession.setState({ status: "signedOut" });
    save(null);
    if (refreshToken) await merchantApi.auth.logout({ refreshToken }).catch(() => undefined);
  },
};
