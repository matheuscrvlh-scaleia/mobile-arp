import { weekdaysLabel } from "@/contracts/common";

/** Hoje (no aparelho, 0 = domingo) está entre os dias em que o cupom vale. */
export function validToday(weekdays: readonly number[], now: number = Date.now()): boolean {
  return weekdays.length === 0 || weekdays.includes(new Date(now).getDay());
}

/** "Vale todos os dias", "Vale seg a sex". */
export function validDaysLabel(weekdays: readonly number[]): string {
  return `Vale ${weekdaysLabel(weekdays)}`;
}
