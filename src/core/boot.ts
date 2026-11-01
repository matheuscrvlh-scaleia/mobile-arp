import { z } from "zod";
import { onSessionChange, sessionActions } from "@/core/auth/session";
import { merchantSession } from "@/core/merchant/merchant-session";
import { cancelAllReminders } from "@/core/notifications/reminders";
import { wireQueryClient } from "@/core/query/query-client";

/*
 * Inicialização fora do React, uma vez por processo. Não depende de rede:
 * o app abre com a sessão e o cache guardados e atualiza em segundo plano.
 */

// Hermes não compila código em tempo de execução: Zod sem a sonda de JIT.
z.config({ jitless: true });

let booting: Promise<void> | null = null;

export function boot(): Promise<void> {
  booting ??= (async () => {
    wireQueryClient();
    onSessionChange((event) => {
      if (event.type === "signedOut") void cancelAllReminders();
    });
    // Visitante e lojista são sessões independentes; nenhuma das duas usa rede aqui.
    await Promise.all([sessionActions.restore(), merchantSession.restore()]);
    sessionActions.warmUp();
  })();
  return booting;
}
