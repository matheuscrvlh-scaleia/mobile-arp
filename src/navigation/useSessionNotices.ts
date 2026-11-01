import { useEffect } from "react";
import { onSessionChange } from "@/core/auth/session";
import { toast } from "@/design";

/** Avisa quando a API encerra a sessão por conta própria (vencida, revogada, conta bloqueada). */
export function useSessionNotices(): void {
  useEffect(
    () =>
      onSessionChange((event) => {
        if (event.type === "signedOut" && event.reason === "expired") {
          toast.show("Sua sessão terminou. Entre de novo para ver seus cupons.", "log-out");
        }
      }),
    [],
  );
}
