/*
 * Ação que o visitante tentou fazer sem conta (pegar cupom, ler QR…). Fica
 * guardada enquanto ele entra ou se cadastra e roda logo depois, para ele
 * voltar exatamente ao que estava fazendo. Só em memória: se o app fechar
 * no meio, a intenção se perde (de propósito).
 */

type Action = () => void | Promise<void>;

let pending: Action | null = null;

export const pendingAction = {
  set(action: Action): void {
    pending = action;
  },
  clear(): void {
    pending = null;
  },
  /** Executa (uma vez) a ação guardada. Chamado depois de entrar ou cadastrar. */
  run(): void {
    const action = pending;
    pending = null;
    if (action) void Promise.resolve(action()).catch(() => undefined);
  },
};
