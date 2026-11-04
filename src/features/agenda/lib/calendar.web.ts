import type { EventDetail } from "@/contracts/app/agenda";

/*
 * Web (react-native-web): não há calendário do aparelho. Mesma API do
 * calendar.ts; devolve "unavailable" e a tela mostra o aviso de sempre.
 */

export type CalendarResult = "added" | "canceled" | "unavailable";

type CalendarEvent = Pick<
  EventDetail,
  "id" | "title" | "place" | "description" | "nextDate" | "startTime" | "endTime"
>;

export async function addToDeviceCalendar(_event: CalendarEvent): Promise<CalendarResult> {
  return "unavailable";
}
