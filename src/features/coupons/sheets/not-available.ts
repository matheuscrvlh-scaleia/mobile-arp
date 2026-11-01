import { sheet } from "@/design";

/** Painel de "a promoção saiu do ar" (COUPON_NOT_AVAILABLE ao pegar). */
export function openNotAvailableSheet(onSeeOthers: () => void) {
  sheet.message({
    icon: "clock-alert",
    iconBackground: "dangerSoft",
    iconColor: "dangerText",
    title: "Essa promoção saiu do ar",
    text: "A loja encerrou ou pausou este cupom, então não dá mais para pegar. Os outros cupons da ARP continuam valendo.",
    actions: [
      { label: "Ver outros cupons", icon: "arrow-right", onPress: onSeeOthers },
      { label: "Fechar", variant: "soft" },
    ],
  });
}
