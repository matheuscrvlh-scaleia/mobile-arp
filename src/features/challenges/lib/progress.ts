/* Regras puras dos desafios do mês: barra, dias restantes, faixas e textos. */
import type { CampaignProgress, Challenges, ScanResult } from "@/contracts/app/challenges";
import { type DateInput, formatDayMonth, plural, startOfDay, toDate } from "@/shared/lib/format";
import { DAY_MS } from "@/shared/lib/time";

/** .qbar i: a barra nunca some (mín. 16%), para o "n/total" caber dentro. */
export const MIN_BAR_PERCENT = 16;
export const QR_PREFIX = "arp://selo/";

type Tier = CampaignProgress["tiers"][number];

/** Largura da barra em % (0–100), com mínimo para o texto caber. */
export function barPercent(earned: number, total: number, min = MIN_BAR_PERCENT): number {
  if (!(total > 0)) return min;
  const pct = (Math.max(0, earned) / total) * 100;
  return Math.min(100, Math.max(min, pct));
}

/**
 * Último instante válido da campanha. O fim costuma ser exclusivo (meia-noite do dia
 * seguinte): tirar 1 ms faz "01/12 00:00" virar "30/11".
 */
export function lastValidDay(endsAt: DateInput): Date {
  return new Date(toDate(endsAt).getTime() - 1);
}

/** "dd/mm" do último dia da campanha. */
export function formatEndDay(endsAt: DateInput): string {
  return formatDayMonth(lastValidDay(endsAt));
}

/** Dias de calendário até o último dia da campanha (0 = termina hoje; negativo = acabou). */
export function daysLeft(endsAt: DateInput, now: DateInput): number {
  const end = startOfDay(lastValidDay(endsAt)).getTime();
  const today = startOfDay(now).getTime();
  // round: absorve a hora a mais/a menos do horário de verão
  return Math.round((end - today) / DAY_MS);
}

/** "faltam 12 dias" / "falta 1 dia" / "termina hoje" / "encerrado". */
export function daysLeftLabel(days: number): string {
  if (days < 0) return "encerrado";
  if (days === 0) return "termina hoje";
  return `${plural(days, "falta", "faltam", false)} ${plural(days, "dia", "dias")}`;
}

/** "Falta 1 selo" / "Faltam 3 selos". */
export function missingSealsLabel(missing: number): string {
  return `${plural(missing, "Falta", "Faltam", false)} ${plural(missing, "selo", "selos")}`;
}

/** Subtítulo do hero: próxima faixa ou mês completo. */
export function nextTierText(progress: CampaignProgress): string {
  const next = progress.nextTier;
  if (next) return `${missingSealsLabel(Math.max(1, next.missing))} para: ${next.label}`;
  if (progress.tiers.length === 0 && progress.earned < progress.total) {
    return `${missingSealsLabel(progress.total - progress.earned)} para completar o mês`;
  }
  return "Você completou o mês! 🎉";
}

/** Faixa que o selo recém-ganho acabou de alcançar (threshold === earned). */
export function justReachedTier(progress: CampaignProgress): Tier | null {
  return progress.tiers.find((t) => t.reached && t.threshold === progress.earned) ?? null;
}

/** Primeira letra minúscula ("Brinde na loja" → "brinde na loja"), como no protótipo. */
export function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

const CAMPAIGN_PREFIX = /^desafios?\s+(de|do|da)\s+/i;

/** "Desafios de novembro" → "novembro"; nomes livres ficam como estão. */
export function campaignShortName(name: string): string {
  const short = name.trim().replace(CAMPAIGN_PREFIX, "").trim();
  return short || name.trim();
}

/** Pill do hero: "Desafios de novembro" (sem repetir "Desafios de"). */
export function campaignLabel(name: string): string {
  return `Desafios de ${campaignShortName(name)}`;
}

/** Todos os desafios com QR já conquistados (não há mais o que ler este mês). */
export function allQrDone(data: Pick<Challenges, "challenges"> | undefined): boolean {
  const qr = data?.challenges.filter((c) => c.validation === "qr") ?? [];
  return qr.length > 0 && qr.every((c) => c.earned);
}

/** Texto lido do QR é da ARP? (antes de chamar a API) */
export function isArpSealPayload(text: string): boolean {
  return text.trim().startsWith(QR_PREFIX) && text.trim().length > QR_PREFIX.length;
}

/** Campo "Digitar código": aceita o token ou o payload inteiro. */
export function normalizeTypedCode(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return trimmed.startsWith(QR_PREFIX) ? trimmed : `${QR_PREFIX}${trimmed}`;
}

/** Cache de /challenges depois de um selo ganho: marca o desafio e troca o progresso. */
export function applyScanResult(data: Challenges, result: ScanResult): Challenges {
  return {
    ...data,
    challenges: data.challenges.map((c) =>
      c.id === result.challenge.id ? { ...c, earned: true, earnedAt: result.earnedAt } : c,
    ),
    progress: result.progress,
  };
}
