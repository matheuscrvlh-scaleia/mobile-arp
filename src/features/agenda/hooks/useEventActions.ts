import { useState } from "react";
import { Share } from "react-native";
import type { EventDetail } from "@/contracts/app/agenda";
import { toast } from "@/design";
import { addToDeviceCalendar } from "../lib/calendar";

const CALENDAR_FAILED = "Não foi possível abrir o calendário do aparelho";

/** Ações da tela do evento: compartilhar e "adicionar ao calendário" do aparelho. */
export function useEventActions(event: EventDetail) {
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  const share = () => {
    Share.share({
      title: event.title,
      message: `${event.title} na ARP\narp://evento/${event.id}`,
    }).catch(() => undefined);
  };

  const addToCalendar = () => {
    if (addingToCalendar) return;
    setAddingToCalendar(true);
    addToDeviceCalendar(event)
      .then((result) => {
        if (result === "added") toast.show("Adicionado ao seu calendário", "calendar-check");
        else if (result === "unavailable") toast.show(CALENDAR_FAILED, "circle-alert");
      })
      .catch(() => toast.show(CALENDAR_FAILED, "circle-alert"))
      .finally(() => setAddingToCalendar(false));
  };

  return { share, addToCalendar, addingToCalendar };
}
