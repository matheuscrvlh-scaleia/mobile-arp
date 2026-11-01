import type { Agenda } from "@/contracts/app/agenda";
import { matchesQuery } from "@/shared/lib/text";

export type EventHit = Agenda["days"][number]["events"][number] & { date: string };

/** Próximo dia de cada evento cujo título casa com a busca (sem acento). */
export function filterEvents(agenda: Agenda | undefined, q: string, limit = 6): EventHit[] {
  if (!agenda || q.length < 2) return [];
  const seen = new Set<string>();
  const hits: EventHit[] = [];
  for (const day of agenda.days) {
    for (const ev of day.events) {
      if (seen.has(ev.id) || !matchesQuery(ev.title, q)) continue;
      seen.add(ev.id);
      hits.push({ ...ev, date: day.date });
    }
  }
  return hits.slice(0, limit);
}
