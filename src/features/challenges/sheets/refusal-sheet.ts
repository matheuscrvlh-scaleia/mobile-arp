/* Painéis de recusa da leitura do QR (ACTIONS.scanExpired / scanDup do protótipo + inválido
   e "tudo feito"). Usados pelo leitor e pelo link arp://selo/<token>. */
import { type SheetMessageAction, sheet } from "@/design";
import { openPath } from "@/navigation/navigate";
import { getCachedChallenges } from "../api/challenges";
import { campaignShortName } from "../lib/progress";
import { refusalCopy, type ScanRefusal } from "../lib/scan-result";

/** Fecha o leitor/link e mostra a aba Selos (volta para ela se já estiver na pilha). */
export const goToChallenges = (): void => openPath("/desafios");

function challengesLabel(prefix: string): string {
  const name = getCachedChallenges()?.campaign?.name;
  return name ? `${prefix} de ${campaignShortName(name)}` : prefix;
}

export type RefusalSheetOptions = {
  /** `scan`: dá para tentar de novo no leitor; `link`: só ir para os desafios. */
  context: "scan" | "link";
  /** Depois que o painel some (o leitor volta a ler). */
  onClose?: () => void;
};

function refusalActions(kind: ScanRefusal, canRetry: boolean): SheetMessageAction[] {
  const challenges = { onPress: goToChallenges };
  switch (kind) {
    case "expired":
      return canRetry
        ? [
            { label: challengesLabel("Ver desafios"), ...challenges },
            { label: "Tentar de novo", variant: "soft" },
          ]
        : [{ label: challengesLabel("Ver desafios"), ...challenges }];
    case "duplicate":
      return [{ label: "Ver outros desafios", ...challenges }];
    case "allDone":
      return canRetry ? [{ label: "Fechar" }] : [{ label: "Ver meus selos", ...challenges }];
    case "invalid":
      return canRetry
        ? [{ label: "Tentar de novo" }, { label: "Ver desafios", variant: "soft", ...challenges }]
        : [{ label: "Ver desafios", ...challenges }];
  }
}

export function openRefusalSheet(kind: ScanRefusal, { context, onClose }: RefusalSheetOptions) {
  const copy = refusalCopy(kind);
  sheet.message({
    icon: copy.icon,
    iconBackground: copy.iconBg,
    iconColor: copy.iconColor,
    title: copy.title,
    text: copy.text,
    actions: refusalActions(kind, context === "scan"),
    onClose,
  });
}
