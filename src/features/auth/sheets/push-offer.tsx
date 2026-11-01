import { askPushPermission, getPushPermission, pushPreference } from "@/core/notifications/push";
import { kv } from "@/core/storage/kv";
import { sheet, toast } from "@/design";

/* Convite para notificações antes do pedido do sistema: o pedido do sistema
   só aparece se o visitante quiser (um "não" do sistema é difícil de desfazer). */

const OFFERED_KEY = "arp.push.offered";

export type PushOfferOptions = {
  /** Mostra mesmo que o convite já tenha aparecido antes (ex.: fim do cadastro). */
  force?: boolean;
  /** Roda se o visitante aceitar (ex.: agendar o lembrete do cupom recém-pego). */
  onGranted?: () => void;
};

/**
 * Oferece as notificações num momento com contexto (fim do cadastro, login,
 * primeiro cupom pego). Não faz nada se já houver permissão, se o sistema não
 * deixar pedir de novo, se o visitante desligou no perfil ou se outro painel
 * estiver aberto.
 */
export async function offerPushNotifications(options: PushOfferOptions = {}): Promise<void> {
  const { force = false, onGranted } = options;
  if (!pushPreference.isEnabled()) return;
  if (!force && kv.getSync(OFFERED_KEY) === "1") return;
  if ((await getPushPermission()) !== "askable") return;
  if (sheet.isOpen()) return;
  kv.setSync(OFFERED_KEY, "1");
  sheet.message({
    icon: "bell-ring",
    title: "Quer saber das ofertas?",
    text: "Avisamos quando sair cupom novo, quando um evento estiver para começar e antes do seu cupom vencer. Sem exagero.",
    actions: [
      {
        label: "Quero receber",
        icon: "bell",
        onPress: () => {
          void askPushPermission().then((ok) => {
            if (!ok) return;
            toast.show("Notificações ativadas", "bell-ring", { haptic: "light" });
            onGranted?.();
          });
        },
      },
      { label: "Agora não" },
    ],
  });
}
