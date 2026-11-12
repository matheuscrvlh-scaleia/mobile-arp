import { describe, expect, it } from "@jest/globals";
import {
  type AgendaDay,
  type AgendaEvent,
  categoriesOf,
  dateRange,
  daysBetween,
  eventDayLabel,
  evWhen,
  filterByCategory,
  hasShortEvent,
  longEventLabel,
  monthRange,
  monthYearLabel,
  nextEnd,
  nextStart,
  occurrenceLabel,
  periodProgress,
  periodsLabel,
  reminderAt,
  rowDateLabel,
  rowWhen,
  sectionDayLabel,
  shortRangeLabel,
  upcomingAfter,
  upcomingAgendaRange,
  weekdaysLabel,
  weeklyLabel,
} from "./occurrence";

const TODAY = "2026-11-01"; // domingo

const ev = (id: string, over: Partial<AgendaEvent> = {}): AgendaEvent => ({
  id,
  title: `Evento ${id}`,
  category: { id: "cat-musica", name: "Música", icon: "music" },
  imageUrl: null,
  tone: null,
  icon: null,
  place: "Praça central",
  recurrence: "single",
  startsOn: TODAY,
  endsOn: null,
  weekday: null,
  weekdays: null,
  periods: null,
  startTime: "19:00",
  endTime: null,
  isLongRunning: false,
  awardsSeal: false,
  ...over,
});

describe("datas", () => {
  it("conta dias e gera intervalos", () => {
    expect(daysBetween("2026-10-01", "2026-10-31")).toBe(30);
    expect(dateRange("2026-10-30", 4)).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });

  it("rótulos do dia", () => {
    expect(eventDayLabel(TODAY, TODAY)).toBe("Hoje");
    expect(eventDayLabel("2026-11-06", TODAY)).toBe("Sexta, 6");
    expect(eventDayLabel("2026-11-07", TODAY, "short")).toBe("sáb 7");
    expect(eventDayLabel("2026-11-08", TODAY, "date")).toBe("dom, 08/11");
    expect(eventDayLabel(TODAY, TODAY, "date")).toBe("Hoje");
    expect(eventDayLabel("xx", TODAY, "short")).toBe("");
    expect(occurrenceLabel({ startTime: "18:00", endTime: "20:00" }, "2026-11-08", TODAY)).toBe(
      "dom, 08/11 · 18h às 20h",
    );
    expect(occurrenceLabel({ startTime: null, endTime: null }, TODAY, TODAY)).toBe("Hoje");
    expect(sectionDayLabel("2026-11-02", TODAY)).toBe("Amanhã");
    expect(sectionDayLabel(TODAY, TODAY)).toBe("Hoje");
    expect(sectionDayLabel("2026-11-07", TODAY)).toBe("Sábado, 7");
  });

  it("semanal com gênero certo", () => {
    expect(weeklyLabel(6)).toBe("Todo sábado");
    expect(weeklyLabel(0)).toBe("Todo domingo");
    expect(weeklyLabel(5)).toBe("Toda sexta");
  });

  it("período curto", () => {
    expect(shortRangeLabel("2026-11-01", "2026-11-03")).toBe("1 a 3 de nov");
    expect(shortRangeLabel("2026-10-28", "2026-11-02")).toBe("28 de out a 2 de nov");
  });

  it("janela da agenda: hoje..+29 (a mesma da busca)", () => {
    expect(upcomingAgendaRange(TODAY)).toEqual({ from: TODAY, to: "2026-11-30" });
    expect(upcomingAgendaRange(new Date(2026, 11, 20, 23, 59))).toEqual({
      from: "2026-12-20",
      to: "2027-01-18",
    });
  });

  it("mês/ano", () => {
    expect(monthYearLabel(TODAY)).toBe("Novembro 2026");
  });
});

describe("linha de evento", () => {
  it("item da agenda usa o dia da ocorrência", () => {
    expect(rowWhen(ev("a", { startTime: "18:00" }), TODAY, TODAY)).toBe("Hoje · 18h");
    expect(rowWhen(ev("a"), TODAY, "2026-11-06")).toBe("Sexta, 6 · 19h");
    expect(rowWhen(ev("a", { startTime: null }), TODAY, "2026-11-06")).toBe("Sexta, 6");
  });

  it("item da agenda semanal ou de vários dias usa o rótulo do período", () => {
    const weekly = ev("f", {
      recurrence: "weekly",
      startsOn: "2026-07-04",
      weekday: 6,
      startTime: "09:00",
      endTime: "14:00",
    });
    expect(rowWhen(weekly, TODAY, "2026-11-07")).toBe("Todo sábado · 9h às 14h");
    const range = ev("c", { recurrence: "range", startsOn: "2026-11-01", endsOn: "2026-11-03" });
    expect(rowDateLabel(range, TODAY, "2026-11-02")).toBe("1 a 3 de nov");
    // "range" de um dia só: o dia da ocorrência
    const oneDay = ev("d", { recurrence: "range", startsOn: "2026-11-06", endsOn: "2026-11-06" });
    expect(rowDateLabel(oneDay, TODAY, "2026-11-06")).toBe("Sexta, 6");
  });

  it("EventCard: próximo dia, senão o início", () => {
    expect(
      rowDateLabel({ ...ev("j", { startsOn: "2026-11-02" }), nextDate: "2026-11-02" }, TODAY),
    ).toBe("Segunda, 2");
    expect(rowDateLabel({ ...ev("j", { startsOn: "2026-11-06" }), nextDate: null }, TODAY)).toBe(
      "Sexta, 6",
    );
    const weekly = {
      ...ev("f", { recurrence: "weekly", startsOn: "2026-07-04", weekday: 6 }),
      nextDate: "2026-11-07",
    };
    expect(rowWhen(weekly, TODAY)).toBe("Todo sábado · 19h");
  });
});

describe("evWhen", () => {
  const base = { weekday: null, isLongRunning: false, endsOn: null };
  it("um dia", () => {
    expect(evWhen({ ...base, recurrence: "single", startsOn: "2026-11-02" })).toBe(
      "Segunda, 2 de novembro",
    );
  });
  it("vários dias", () => {
    expect(
      evWhen({ ...base, recurrence: "range", startsOn: "2026-11-01", endsOn: "2026-11-03" }),
    ).toBe("1 a 3 de novembro · 3 dias");
    expect(
      evWhen({ ...base, recurrence: "range", startsOn: "2026-10-30", endsOn: "2026-11-02" }),
    ).toBe("30/10 a 02/11 · 4 dias");
  });
  it("semanal", () => {
    expect(evWhen({ ...base, recurrence: "weekly", startsOn: "2026-07-03", weekday: 6 })).toBe(
      "Todo sábado",
    );
  });
  it("longo", () => {
    const long = {
      ...base,
      isLongRunning: true,
      recurrence: "range" as const,
      startsOn: "2026-10-01",
      endsOn: "2026-10-31",
    };
    expect(evWhen(long)).toBe("1 a 31 de outubro · todos os dias");
    expect(longEventLabel(long)).toBe("Todo o mês");
    expect(longEventLabel({ startsOn: "2026-10-05", endsOn: "2026-10-31" })).toBe("Todos os dias");
  });
});

describe("horários", () => {
  it("próximo início e fim", () => {
    const e = { nextDate: "2026-11-02", startTime: "19:00", endTime: "22:30" };
    expect(nextStart(e)).toEqual(new Date(2026, 10, 2, 19, 0));
    expect(nextEnd(e)).toEqual(new Date(2026, 10, 2, 22, 30));
    expect(reminderAt(e)).toEqual(new Date(2026, 10, 2, 17, 0));
  });
  it("sem horário: 9h, fim +2 h", () => {
    const e = { nextDate: "2026-11-02", startTime: null, endTime: null };
    expect(nextStart(e)).toEqual(new Date(2026, 10, 2, 9, 0));
    expect(reminderAt(e)).toEqual(new Date(2026, 10, 2, 9, 0));
    expect(nextEnd(e)).toEqual(new Date(2026, 10, 2, 11, 0));
  });
  it("termina depois da meia-noite", () => {
    const e = { nextDate: "2026-11-02", startTime: "16:00", endTime: "00:00" };
    expect(nextEnd(e)).toEqual(new Date(2026, 10, 3, 0, 0));
  });
  it("encerrado", () => {
    expect(nextStart({ nextDate: null, startTime: "10:00", endTime: null })).toBeNull();
  });
});

describe("periodProgress", () => {
  it("usa o período do evento", () => {
    expect(periodProgress({ startsOn: "2026-10-01", endsOn: "2026-10-31" }, "2026-10-10")).toEqual({
      total: 31,
      index: 9,
    });
    expect(periodProgress({ startsOn: "2026-11-01", endsOn: "2026-11-03" }, "2026-11-05")).toEqual({
      total: 3,
      index: 2,
    });
  });
  it("direto do item da agenda (evento longo)", () => {
    const long = ev("l", {
      isLongRunning: true,
      recurrence: "range",
      startsOn: "2026-11-01",
      endsOn: "2026-11-30",
    });
    expect(periodProgress(long, "2026-11-08")).toEqual({ total: 30, index: 7 });
    expect(longEventLabel(long)).toBe("Todo o mês");
  });
  it("sem período, o mês do dia", () => {
    expect(periodProgress(null, "2026-11-08")).toEqual({ total: 30, index: 7 });
    expect(periodProgress({ startsOn: "2026-11-01", endsOn: null }, "2026-11-08")).toEqual({
      total: 30,
      index: 7,
    });
  });
});

describe("agenda", () => {
  const days: AgendaDay[] = [
    { date: "2026-11-01", events: [ev("long", { isLongRunning: true }), ev("a")] },
    {
      date: "2026-11-02",
      events: [ev("a"), ev("b", { category: { id: "cat-cine", name: "Cinema", icon: "film" } })],
    },
    { date: "2026-11-03", events: [ev("long", { isLongRunning: true })] },
    { date: "2026-11-05", events: [ev("c"), ev("d"), ev("e")] },
    { date: "2026-11-07", events: [ev("f")] },
  ];

  it("ponto só com evento não longo", () => {
    expect(hasShortEvent(days[0]?.events)).toBe(true);
    expect(hasShortEvent(days[2]?.events)).toBe(false);
    expect(hasShortEvent(undefined)).toBe(false);
  });

  it("próximos dias sem repetir e sem longos", () => {
    const up = upcomingAfter(days, "2026-11-01");
    expect(up.map((x) => `${x.event.id}@${x.date}`)).toEqual([
      "a@2026-11-02",
      "b@2026-11-02",
      "c@2026-11-05",
      "d@2026-11-05",
    ]);
    expect(upcomingAfter(days, "2026-11-01", 4, new Set(["a"]))[0]?.event.id).toBe("b");
  });

  it("categorias e filtro", () => {
    expect(categoriesOf(days).map((c) => c.name)).toEqual(["Cinema", "Música"]);
    const cine = filterByCategory(days, "cat-cine");
    expect(cine).toEqual([{ date: "2026-11-02", events: [days[1]?.events[1]] }]);
    expect(filterByCategory(days, null)).toHaveLength(5);
  });
});

describe("monthRange", () => {
  it("mês atual inteiro, inclusive os dias que já passaram", () => {
    const r = monthRange("2026-11-03", 0);
    expect(r.from).toBe("2026-11-01");
    expect(r.to).toBe("2026-11-30");
    expect(r.days).toHaveLength(30);
  });
  it("volta e avança entre anos", () => {
    expect(monthRange("2026-01-15", -1).from).toBe("2025-12-01");
    expect(monthRange("2026-12-15", 1).to).toBe("2027-01-31");
    expect(monthRange("2028-01-10", 1).days).toHaveLength(29);
  });
});

describe("vários períodos e dias da semana", () => {
  const oct = [
    { startsOn: "2026-10-10", endsOn: "2026-10-12" },
    { startsOn: "2026-10-17", endsOn: "2026-10-19" },
  ];
  it("lista os trechos do mesmo mês sem repetir o mês", () => {
    expect(periodsLabel(oct)).toBe("10 a 12 e 17 a 19 de out");
  });
  it("trecho de um dia mostra só o dia", () => {
    expect(
      periodsLabel([
        { startsOn: "2026-10-10", endsOn: "2026-10-10" },
        { startsOn: "2026-10-17", endsOn: "2026-10-19" },
      ]),
    ).toBe("10 e 17 a 19 de out");
  });
  it("evento em dois trechos não aparece como um período só", () => {
    const e = ev("p", {
      recurrence: "range",
      startsOn: "2026-10-10",
      endsOn: "2026-10-19",
      periods: oct,
    });
    expect(evWhen(e)).not.toContain("10 a 19");
  });
  it("dias da semana", () => {
    expect(weekdaysLabel([6])).toBe(weeklyLabel(6));
    expect(weekdaysLabel([0, 1, 2, 3, 4, 5, 6])).toBe("Todos os dias");
  });
});
