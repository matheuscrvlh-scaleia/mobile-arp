import { describe, expect, it } from "@jest/globals";
import type { Agenda } from "@/contracts/app/agenda";
import { filterEvents } from "./events-search";
import { parseRecent, pushRecent } from "./recent-searches";

describe("recent searches", () => {
  it("põe no topo sem repetir e limita a 6", () => {
    expect(pushRecent(["pizza", "Cafe"], "café")).toEqual(["café", "pizza"]);
    expect(pushRecent(["a1", "a2", "a3", "a4", "a5", "a6"], "novo")).toHaveLength(6);
    expect(pushRecent(["pizza"], " x ")).toEqual(["pizza"]);
  });

  it("lê JSON com segurança", () => {
    expect(parseRecent(null)).toEqual([]);
    expect(parseRecent("{")).toEqual([]);
    expect(parseRecent('["a", 1, "b"]')).toEqual(["a", "b"]);
  });
});

describe("filterEvents", () => {
  const ev = (id: string, title: string) =>
    ({ id, title }) as Agenda["days"][number]["events"][number];
  const agenda = {
    days: [
      { date: "2026-11-01", events: [ev("1", "Feira de Artesanato"), ev("2", "Música ao vivo")] },
      { date: "2026-11-02", events: [ev("1", "Feira de Artesanato"), ev("3", "Música na praça")] },
    ],
  } as Agenda;

  it("próximo dia de cada evento, sem acento", () => {
    expect(filterEvents(agenda, "musica").map((e) => [e.id, e.date])).toEqual([
      ["2", "2026-11-01"],
      ["3", "2026-11-02"],
    ]);
    expect(filterEvents(agenda, "feira")).toHaveLength(1);
  });

  it("busca curta ou sem agenda não acha nada", () => {
    expect(filterEvents(agenda, "f")).toEqual([]);
    expect(filterEvents(undefined, "feira")).toEqual([]);
  });
});
