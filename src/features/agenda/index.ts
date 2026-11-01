/* API pública da agenda: o que as outras features podem importar. */
export { useAgenda, useEvent } from "./api/agenda";
export { EventArt, type EventArtProps, eventIcon } from "./components/EventArt";
export { EventRow, type EventRowProps } from "./components/EventRow";
export {
  AGENDA_WINDOW_DAYS,
  type AgendaEvent,
  type AgendaRange,
  type EventDayStyle,
  eventDayLabel,
  longEventLabel,
  occurrenceLabel,
  rowWhen,
  sectionDayLabel,
  upcomingAgendaRange,
} from "./lib/occurrence";
