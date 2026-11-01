// SDK 58: as funções antigas importadas de "expo-calendar" lançam erro em runtime. A nova
// `calendar.addEventWithForm()` exige um ExpoCalendar (getDefaultCalendarSync é só iOS e o
// Android pede getCalendars + permissão). O formulário do sistema pela API legada abre sem
// permissão no Android e no iOS 17+, então usamos ela.
import {
  CalendarDialogResultActions,
  createEventInCalendarAsync,
  requestCalendarPermissionsAsync,
} from "expo-calendar/legacy";
import { Platform } from "react-native";
import type { EventDetail } from "@/contracts/app/agenda";
import { nextEnd, nextStart } from "./occurrence";

export type CalendarResult = "added" | "canceled" | "unavailable";

type CalendarEvent = Pick<
  EventDetail,
  "id" | "title" | "place" | "description" | "nextDate" | "startTime" | "endTime"
>;

/** Abre o "novo evento" do calendário do aparelho preenchido com o próximo dia do evento. */
export async function addToDeviceCalendar(event: CalendarEvent): Promise<CalendarResult> {
  const startDate = nextStart(event);
  const endDate = nextEnd(event);
  if (!startDate || !endDate) return "unavailable";

  const data = {
    title: event.title,
    location: `ARP · ${event.place}`,
    notes: event.description,
    startDate,
    endDate,
    allDay: !event.startTime,
    url: `arp://evento/${event.id}`,
  };

  const open = () => createEventInCalendarAsync(data);
  let result: Awaited<ReturnType<typeof open>>;
  try {
    result = await open();
  } catch (error) {
    // iOS < 17 exige permissão para o formulário: pede e tenta de novo.
    if (Platform.OS !== "ios") throw error;
    const permission = await requestCalendarPermissionsAsync();
    if (!permission.granted) return "unavailable";
    result = await open();
  }
  // No iOS "done" é só fechar; o Android sempre devolve "done" (não sabe se salvou).
  if (result.action === CalendarDialogResultActions.saved) return "added";
  if (Platform.OS === "android" && result.action === CalendarDialogResultActions.done) {
    return "added";
  }
  return "canceled";
}
