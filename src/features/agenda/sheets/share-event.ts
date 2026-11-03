import * as Clipboard from "expo-clipboard";
import { Linking } from "react-native";
import type { EventDetail } from "@/contracts/app/agenda";
import { APP_API_PREFIX, APP_ROUTES } from "@/contracts/app/routes";
import { path } from "@/contracts/routes";
import { env } from "@/core/config/env";
import { sheet, toast } from "@/design";
import { timeRange } from "@/shared/lib/format";
import { evWhen } from "../lib/occurrence";

/*
 * Compartilhar evento (Fase 2): o foco é o WhatsApp. O link aponta para a página
 * pública do evento na API, que tem as tags Open Graph: o WhatsApp mostra a foto,
 * o título e o texto na prévia. Também dá para só copiar o link.
 */

export function eventShareLink(eventId: string): string {
  return `${env.apiUrl}${APP_API_PREFIX}${path(APP_ROUTES.agenda.share.path, { id: eventId })}`;
}

/** Texto básico do evento: nome, quando, onde e o link. */
export function eventShareText(event: EventDetail): string {
  const time = event.startTime ? ` · ${timeRange(event.startTime, event.endTime)}` : "";
  return [
    `${event.title} na ARP`,
    `${evWhen(event)}${time}`,
    `${event.place} · ARP, Nova Friburgo`,
    eventShareLink(event.id),
  ].join("\n");
}

async function sendToWhatsApp(text: string): Promise<void> {
  const encoded = encodeURIComponent(text);
  try {
    await Linking.openURL(`whatsapp://send?text=${encoded}`);
  } catch {
    // sem o app do WhatsApp (ou sem permissão de abrir o esquema): o wa.me abre no navegador
    try {
      await Linking.openURL(`https://wa.me/?text=${encoded}`);
    } catch {
      toast.show("Não foi possível abrir o WhatsApp", "circle-alert");
    }
  }
}

export function openShareEventSheet(event: EventDetail) {
  sheet.message({
    icon: "share-2",
    title: "Compartilhar evento",
    text: `Mande ${event.title} para os amigos. No WhatsApp, a mensagem vai com a foto e o resumo do evento.`,
    actions: [
      {
        label: "Enviar no WhatsApp",
        icon: "message-circle",
        onPress: () => void sendToWhatsApp(eventShareText(event)),
      },
      {
        label: "Copiar link",
        icon: "copy",
        variant: "soft",
        onPress: () => {
          Clipboard.setStringAsync(eventShareLink(event.id))
            .then(() => toast.show("Link do evento copiado", "copy-check"))
            .catch(() => toast.show("Não foi possível copiar o link", "circle-alert"));
        },
      },
    ],
  });
}
