import { Linking } from "react-native";
import { env } from "@/core/config/env";
import { Button, SheetActions, SheetIcon, SheetText, SheetTitle, sheet } from "@/design";

export function openAboutSheet(): void {
  sheet.message({
    icon: "info",
    // quadrado escuro nos dois temas (como o selo da marca), com o ícone verde
    iconBackground: "chrome",
    iconColor: "brand",
    title: "ARP · Onde tudo acontece",
    text: `Lojas, sabores, eventos, cupons e selos da ARP num lugar só. Versão ${env.appVersion}.`,
    actions: [{ label: "Fechar", variant: "soft" }],
  });
}

export function openSignOutSheet(onConfirm: () => void): void {
  sheet.message({
    icon: "log-out",
    iconBackground: "dangerSoft",
    iconColor: "dangerText",
    title: "Sair da conta?",
    text: "Seus cupons e selos continuam guardados na sua conta. É só entrar de novo para ver tudo.",
    actions: [
      { label: "Sair", icon: "log-out", onPress: onConfirm },
      { label: "Continuar conectado" },
    ],
  });
}

const openSettings = () => void Linking.openSettings().catch(() => undefined);

/** O sistema não deixa pedir de novo: só pelos ajustes do aparelho. */
export function openNotificationsBlockedSheet(): void {
  sheet.open(({ close, closeThen }) => (
    <>
      <SheetIcon name="bell" background="surface" />
      <SheetTitle>Notificações bloqueadas</SheetTitle>
      <SheetText>
        As notificações da ARP estão desligadas nos ajustes do aparelho. Ative por lá para receber
        ofertas e lembretes dos seus cupons.
      </SheetText>
      <SheetActions>
        <Button
          label="Abrir ajustes"
          iconRight="arrow-up-right"
          onPress={closeThen(openSettings)}
        />
        <Button label="Agora não" variant="soft" onPress={close} />
      </SheetActions>
    </>
  ));
}

/**
 * Desligar no app desvincula este aparelho da conta no ERP (`unregisterPushToken`):
 * as ofertas e avisos param de chegar, inclusive com o app fechado. Os lembretes
 * locais que o visitante pediu (cupom vencendo, evento começando) são do aparelho
 * e continuam; para silenciar tudo, o caminho são os ajustes do sistema.
 */
export function openNotificationsPausedSheet(): void {
  sheet.message({
    icon: "bell",
    iconBackground: "surface",
    title: "Notificações desligadas",
    text: "Você não vai mais receber ofertas e avisos da ARP neste aparelho, nem com o app fechado. Os lembretes que você pediu (cupom vencendo, evento começando) continuam. Para religar, é só ligar o interruptor de novo.",
    actions: [{ label: "Entendi" }],
  });
}
