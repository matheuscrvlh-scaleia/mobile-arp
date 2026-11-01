import { describe, expect, it } from "@jest/globals";
import type { StoreHours } from "@/contracts/directory";
import {
  closingTimeToday,
  formatHoursToday,
  isOpenAt,
  nextOpening,
  openStatus,
  weekSchedule,
} from "./hours";

// 2026-11-01 é domingo (weekday 0); dia 0 = sábado 31/10, -1 = sexta 30/10.
const at = (day: number, hh: number, mm = 0) => new Date(2026, 10, day, hh, mm);

const regular: StoreHours[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  opensAt: "11:00",
  closesAt: "23:00",
}));

// Bar: sexta e sábado das 16h às 0h30; domingo fechado.
const bar: StoreHours[] = [
  { weekday: 5, opensAt: "16:00", closesAt: "00:30" },
  { weekday: 6, opensAt: "16:00", closesAt: "00:30" },
];

describe("isOpenAt", () => {
  it("horário comum", () => {
    expect(isOpenAt(regular, at(1, 10, 59))).toBe(false);
    expect(isOpenAt(regular, at(1, 11))).toBe(true);
    expect(isOpenAt(regular, at(1, 22, 59))).toBe(true);
    expect(isOpenAt(regular, at(1, 23))).toBe(false);
  });

  it("passa da meia-noite: a madrugada é do dia em que abriu", () => {
    // sábado 31/10 23h → aberto (turno de sábado)
    expect(isOpenAt(bar, at(0, 23))).toBe(true);
    // domingo 01/11 0h15 → ainda é o turno de sábado
    expect(isOpenAt(bar, at(1, 0, 15))).toBe(true);
    // domingo 0h30 → fechou
    expect(isOpenAt(bar, at(1, 0, 30))).toBe(false);
    // sexta 30/10 0h15 → quinta não abriu, fechado
    expect(isOpenAt(bar, at(-1, 0, 15))).toBe(false);
  });

  it("fechar à meia-noite (00:00)", () => {
    const h: StoreHours[] = [{ weekday: 0, opensAt: "18:00", closesAt: "00:00" }];
    expect(isOpenAt(h, at(1, 23, 59))).toBe(true);
    expect(isOpenAt(h, at(1, 17, 59))).toBe(false);
    expect(isOpenAt(h, at(2, 0, 0))).toBe(false);
  });

  it("sem horários = fechado", () => {
    expect(isOpenAt([], at(1, 12))).toBe(false);
  });
});

describe("closingTimeToday / openStatus", () => {
  it("fecha às 23h", () => {
    expect(closingTimeToday(regular, at(1, 12))).toBe("23:00");
    expect(openStatus(regular, at(1, 12))).toEqual({
      open: true,
      label: "Aberto agora · fecha às 23h",
    });
  });

  it("turno da madrugada fecha à 0h30", () => {
    expect(closingTimeToday(bar, at(1, 0, 10))).toBe("00:30");
    expect(openStatus(bar, at(0, 20)).label).toBe("Aberto agora · fecha à 0h30");
  });

  it("meia-noite", () => {
    const h: StoreHours[] = [{ weekday: 0, opensAt: "18:00", closesAt: "00:00" }];
    expect(openStatus(h, at(1, 19)).label).toBe("Aberto agora · fecha à meia-noite");
  });

  it("fechado: diz quando abre", () => {
    expect(openStatus(regular, at(1, 9)).label).toBe("Fechado agora · abre às 11h");
    expect(openStatus(regular, at(1, 23, 30)).label).toBe("Fechado agora · abre amanhã às 11h");
    // domingo à tarde → bar só abre na sexta
    expect(openStatus(bar, at(1, 15)).label).toBe("Fechado agora · abre sexta às 16h");
    expect(openStatus([], at(1, 15)).label).toBe("Fechado agora");
  });

  it("nextOpening", () => {
    expect(nextOpening(bar, at(2, 10))).toEqual({ opensAt: "16:00", daysAhead: 4, weekday: 5 });
  });
});

describe("formatHoursToday / weekSchedule", () => {
  it("horário do dia", () => {
    expect(formatHoursToday(regular, at(1, 8))).toBe("11h às 23h");
    expect(formatHoursToday(bar, at(0, 8))).toBe("16h à 0h30");
    expect(formatHoursToday(bar, at(1, 8))).toBe("Fechado hoje");
  });

  it("semana de segunda a domingo com hoje marcado", () => {
    const week = weekSchedule(bar, at(1, 8));
    expect(week.map((r) => r.day)).toEqual([
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
      "Domingo",
    ]);
    expect(week[4]?.hours).toBe("16h à 0h30");
    expect(week[0]?.hours).toBe("Fechado");
    expect(week.find((r) => r.isToday)?.day).toBe("Domingo");
  });
});
