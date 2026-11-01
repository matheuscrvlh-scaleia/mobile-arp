/* Regras puras da tela do evento: as linhas "Quando / Horário / Onde / Na loja / Interesse". */
import type { EventDetail } from "@/contracts/app/agenda";
import { plural, timeRange } from "@/shared/lib/format";
import { evWhen } from "./occurrence";

export type EventFactKey = "when" | "time" | "where" | "store" | "interest";

export type EventFact = {
  key: EventFactKey;
  icon: "calendar-days" | "clock" | "map-pin" | "store" | "heart";
  label: string;
  value: string;
  /** Caminho aberto ao tocar (null = linha sem toque). */
  href: string | null;
  hint?: string;
};

/** Caminho da loja do evento (sempre pelo slug, como no resto do app). */
export function eventStorePath(store: { slug: string }): string {
  return `/loja/${store.slug}`;
}

/** Aba do mapa já no andar do evento. */
export function eventFloorPath(floor: { id: string }): string {
  return `/mapa?andar=${encodeURIComponent(floor.id)}`;
}

/** Evento sem próxima ocorrência já acabou. */
export function isEventEnded(event: Pick<EventDetail, "nextDate">): boolean {
  return event.nextDate == null;
}

/** Linhas de fatos do evento, na ordem da tela. */
export function eventFacts(event: EventDetail): EventFact[] {
  const facts: EventFact[] = [
    { key: "when", icon: "calendar-days", label: "Quando", value: evWhen(event), href: null },
  ];
  if (event.startTime) {
    facts.push({
      key: "time",
      icon: "clock",
      label: "Horário",
      value: timeRange(event.startTime, event.endTime),
      href: null,
    });
  }
  facts.push({
    key: "where",
    icon: "map-pin",
    label: "Onde",
    value: event.place,
    href: event.floor ? eventFloorPath(event.floor) : null,
    hint: event.floor ? `Abre o mapa no ${event.floor.label}` : undefined,
  });
  if (event.store) {
    facts.push({
      key: "store",
      icon: "store",
      label: "Na loja",
      value: event.store.name,
      href: eventStorePath(event.store),
      hint: "Abre a página da loja",
    });
  }
  if (event.interestsCount > 0) {
    facts.push({
      key: "interest",
      icon: "heart",
      label: "Interesse",
      value: `${plural(event.interestsCount, "pessoa", "pessoas")} com interesse`,
      href: null,
    });
  }
  return facts;
}
