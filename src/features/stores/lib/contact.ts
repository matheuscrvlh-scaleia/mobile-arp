import type { StoreDetail } from "@/contracts/app/stores";

export type ContactKind = "whatsapp" | "phone" | "instagram" | "website";

export type ContactOption = { kind: ContactKind; label: string; value: string; url: string };

type ContactFields = Pick<StoreDetail, "whatsapp" | "phone" | "instagram" | "website">;

const digitsOf = (s: string) => s.replace(/\D/g, "");

/** Formas de falar com a loja que existem no cadastro, já com o link para o `Linking`. */
export function contactOptions(store: ContactFields): ContactOption[] {
  const out: ContactOption[] = [];

  const wa = store.whatsapp ? digitsOf(store.whatsapp) : "";
  if (wa.length >= 8) {
    // número brasileiro sem DDI (até 11 dígitos) ganha o 55
    const full = wa.length <= 11 ? `55${wa}` : wa;
    out.push({
      kind: "whatsapp",
      label: "WhatsApp",
      value: store.whatsapp ?? "",
      url: `https://wa.me/${full}`,
    });
  }

  const phone = store.phone ? digitsOf(store.phone) : "";
  if (phone.length >= 8) {
    const plus = store.phone?.trim().startsWith("+") ? "+" : "";
    out.push({
      kind: "phone",
      label: "Telefone",
      value: store.phone ?? "",
      url: `tel:${plus}${phone}`,
    });
  }

  const ig = store.instagram?.trim() ?? "";
  if (ig) {
    const fromUrl = /instagram\.com\/([^/?#]+)/i.exec(ig)?.[1];
    const handle = (fromUrl ?? ig).replace(/^@/, "");
    if (handle) {
      out.push({
        kind: "instagram",
        label: "Instagram",
        value: `@${handle}`,
        url: `https://instagram.com/${handle}`,
      });
    }
  }

  const site = store.website?.trim() ?? "";
  if (site) {
    const url = /^https?:\/\//i.test(site) ? site : `https://${site}`;
    out.push({
      kind: "website",
      label: "Site",
      value: url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, ""),
      url,
    });
  }

  return out;
}
