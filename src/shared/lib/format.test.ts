import { describe, expect, it } from "@jest/globals";
import {
  addDays,
  capitalize,
  daysInMonth,
  formatDayMonth,
  formatHMS,
  formatHour,
  formatLongDate,
  formatMoneyCents,
  formatMoneyShort,
  formatTime,
  greeting,
  isSameDay,
  parseISODate,
  plural,
  timeRange,
  toISODate,
} from "./format";

const NBSP = " ";

describe("datas", () => {
  it("formatLongDate", () => {
    expect(formatLongDate(new Date(2025, 10, 1))).toBe("Sábado, 1 de novembro");
    expect(formatLongDate("2026-03-02")).toBe("Segunda, 2 de março");
  });

  it("formatDayMonth", () => {
    expect(formatDayMonth(new Date(2026, 10, 1))).toBe("01/11");
  });

  it("formatTime usa a hora local", () => {
    const d = new Date(2026, 0, 5, 9, 7);
    expect(formatTime(d)).toBe("09:07");
    expect(formatTime(d.toISOString())).toBe("09:07");
    expect(formatTime(d.getTime())).toBe("09:07");
  });

  it("parseISODate / toISODate são dia local", () => {
    const d = parseISODate("2026-11-01");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10);
    expect(d.getDate()).toBe(1);
    expect(d.getHours()).toBe(0);
    expect(toISODate(d)).toBe("2026-11-01");
    expect(toISODate(new Date(2026, 0, 9, 23, 59))).toBe("2026-01-09");
    expect(Number.isNaN(parseISODate("01/11/2026").getTime())).toBe(true);
  });

  it("addDays atravessa mês e ano sem mutar a entrada", () => {
    const d = new Date(2026, 11, 31);
    expect(toISODate(addDays(d, 1))).toBe("2027-01-01");
    expect(toISODate(addDays(d, -31))).toBe("2026-11-30");
    expect(toISODate(d)).toBe("2026-12-31");
  });

  it("isSameDay", () => {
    expect(isSameDay(new Date(2026, 1, 3, 0, 1), new Date(2026, 1, 3, 23, 59))).toBe(true);
    expect(isSameDay(new Date(2026, 1, 3), new Date(2026, 1, 4))).toBe(false);
    expect(isSameDay("2026-02-03", new Date(2026, 1, 3, 12))).toBe(true);
  });

  it("daysInMonth", () => {
    expect(daysInMonth(new Date(2026, 1, 10))).toBe(28);
    expect(daysInMonth(new Date(2028, 1, 10))).toBe(29);
    expect(daysInMonth("2026-11-01")).toBe(30);
    expect(daysInMonth("2026-12-15")).toBe(31);
  });
});

describe("formatHMS", () => {
  it("formata e zera no fim", () => {
    expect(formatHMS(0)).toBe("00:00:00");
    expect(formatHMS(-5000)).toBe("00:00:00");
    expect(formatHMS(Number.NaN)).toBe("00:00:00");
    expect(formatHMS(1999)).toBe("00:00:01");
    expect(formatHMS((7 * 3600 + 5 * 60 + 9) * 1000)).toBe("07:05:09");
    expect(formatHMS(30 * 3600 * 1000)).toBe("30:00:00");
  });
});

describe("dinheiro", () => {
  it("formatMoneyCents", () => {
    expect(formatMoneyCents(3750)).toBe(`R$${NBSP}37,50`);
    expect(formatMoneyCents(5)).toBe(`R$${NBSP}0,05`);
    expect(formatMoneyCents(123456789)).toBe(`R$${NBSP}1.234.567,89`);
    expect(formatMoneyCents(-1000)).toBe(`-R$${NBSP}10,00`);
  });

  it("formatMoneyShort", () => {
    expect(formatMoneyShort(3700)).toBe(`R$${NBSP}37`);
    expect(formatMoneyShort(3750)).toBe(`R$${NBSP}37,50`);
    expect(formatMoneyShort(150000)).toBe(`R$${NBSP}1.500`);
  });
});

describe("textos", () => {
  it("greeting", () => {
    expect(greeting(5)).toBe("Bom dia");
    expect(greeting(11)).toBe("Bom dia");
    expect(greeting(12)).toBe("Boa tarde");
    expect(greeting(17)).toBe("Boa tarde");
    expect(greeting(18)).toBe("Boa noite");
    expect(greeting(2)).toBe("Boa noite");
  });

  it("plural", () => {
    expect(plural(1, "cupom", "cupons")).toBe("1 cupom");
    expect(plural(0, "cupom", "cupons")).toBe("0 cupons");
    expect(plural(3, "selo", "selos", false)).toBe("selos");
  });

  it("capitalize", () => {
    expect(capitalize("sábado")).toBe("Sábado");
    expect(capitalize("")).toBe("");
  });

  it("formatHour / timeRange", () => {
    expect(formatHour("18:00")).toBe("18h");
    expect(formatHour("18:30")).toBe("18h30");
    expect(formatHour("09:05:00")).toBe("9h05");
    expect(timeRange("18:00")).toBe("18h");
    expect(timeRange("18:00", null)).toBe("18h");
    expect(timeRange("10:00", "22:00")).toBe("10h às 22h");
    expect(timeRange("18:00", "23:30")).toBe("18h às 23h30");
    expect(timeRange("16:00", "00:00")).toBe("16h à 0h");
  });
});
