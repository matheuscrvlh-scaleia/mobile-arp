import { describe, expect, it } from "@jest/globals";
import { findStore, patchStore } from "./cache-patch";
import { contactOptions } from "./contact";
import { shortBlock, storeLocation } from "./location";
import { storeFilters } from "./store-filters";

const store = (id: string, isFavorite = false) => ({ id, slug: `s-${id}`, name: id, isFavorite });

describe("location", () => {
  const where = { block: { name: "Bloco 80" }, floor: { label: "Térreo" } };

  it("abrevia bloco", () => {
    expect(shortBlock("Bloco 80")).toBe("B80");
    expect(shortBlock("Galpão")).toBe("Galpão");
  });

  it("bloco · andar, longo e curto", () => {
    expect(storeLocation(where)).toBe("Bloco 80 · Térreo");
    expect(storeLocation(where, { short: true })).toBe("B80 · Térreo");
  });
});

describe("cache-patch", () => {
  it("detalhe", () => {
    const d = store("1");
    expect(patchStore(d, "1", { isFavorite: true })).toEqual({ ...d, isFavorite: true });
    expect(patchStore(d, "2", { isFavorite: true })).toBe(d);
    expect(patchStore(d, "1", { isFavorite: false })).toBe(d);
  });

  it("página e lista infinita", () => {
    const page = { data: [store("1"), store("2")], meta: { page: 1 } };
    const patched = patchStore(page, "2", { isFavorite: true }) as typeof page;
    expect(patched.data[1]?.isFavorite).toBe(true);
    expect(patched.data[0]).toBe(page.data[0]);

    const infinite = {
      pages: [page, { data: [store("3")], meta: { page: 2 } }],
      pageParams: [1, 2],
    };
    const next = patchStore(infinite, "3", { isFavorite: true }) as typeof infinite;
    expect(next.pages[1]?.data[0]?.isFavorite).toBe(true);
    expect(next.pages[0]).toBe(page);
    expect(patchStore(infinite, "9", { isFavorite: true })).toBe(infinite);
  });

  it("acha a loja em qualquer formato", () => {
    const infinite = { pages: [{ data: [store("1"), store("2")] }] };
    expect(findStore(infinite, "2")?.slug).toBe("s-2");
    expect(findStore(infinite, "s-1")?.id).toBe("1");
    expect(findStore({ data: [] }, "2")).toBeUndefined();
  });
});

describe("contactOptions", () => {
  const none = { whatsapp: null, phone: null, instagram: null, website: null };

  it("sem contato", () => {
    expect(contactOptions(none)).toEqual([]);
  });

  it("monta os links", () => {
    const opts = contactOptions({
      whatsapp: "(54) 99999-1234",
      phone: "+55 54 3333-1234",
      instagram: "https://www.instagram.com/afeitoria/",
      website: "www.afeitoria.com.br/",
    });
    expect(opts.map((o) => o.url)).toEqual([
      "https://wa.me/5554999991234",
      "tel:+555433331234",
      "https://instagram.com/afeitoria",
      "https://www.afeitoria.com.br/",
    ]);
    expect(opts[2]?.value).toBe("@afeitoria");
    expect(opts[3]?.value).toBe("afeitoria.com.br");
  });

  it("whatsapp já com DDI e instagram com @", () => {
    const opts = contactOptions({ ...none, whatsapp: "5554999991234", instagram: "@cafe" });
    expect(opts[0]?.url).toBe("https://wa.me/5554999991234");
    expect(opts[1]?.url).toBe("https://instagram.com/cafe");
  });
});

describe("storeFilters", () => {
  it("sem filtro é sempre a mesma chave (sem openNow=false, categoria nula ou busca vazia)", () => {
    expect(storeFilters({ kind: "food", categoryId: null, q: "  ", openNow: false })).toEqual({
      kind: "food",
    });
  });

  it('"Aberto agora" vai para a API como openNow: true', () => {
    expect(storeFilters({ kind: "shop", categoryId: "c1", q: " café ", openNow: true })).toEqual({
      kind: "shop",
      categoryId: "c1",
      q: "café",
      openNow: true,
    });
  });
});
