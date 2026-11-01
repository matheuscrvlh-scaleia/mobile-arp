import { Asset, getPermissionsAsync, requestPermissionsAsync } from "expo-media-library";
import { type ComponentRef, useRef, useState } from "react";
import { Platform, Share, type View } from "react-native";
import { captureRef, releaseCapture } from "react-native-view-shot";
import type { Claim } from "@/contracts/app/coupons";
import { toast } from "@/design";
import { haptic } from "@/shared/lib/haptics";
import { snapshotFileName, ticketShareText, toFileUri } from "../lib/ticket-image";
import { openGalleryPermissionSheet } from "../sheets/gallery-permission";

type SnapshotView = ComponentRef<typeof View>;

/** idle → (asking: permissão) → save/share: `TicketSnapshot` montado, capturando. */
type Phase = "idle" | "asking" | "save" | "share";
type Job = "save" | "share";

const SAVE_FAILED = "Não foi possível salvar o cupom. Tente de novo.";
const SHARE_FAILED = "Não foi possível compartilhar o cupom.";

/**
 * "Salvar na galeria" e "Compartilhar" do meu cupom. A tela monta o `TicketSnapshot`
 * enquanto `snapshotVisible` e liga `snapshotRef`/`onSnapshotReady` nele: a captura começa
 * no primeiro layout. Pede só permissão de ESCRITA (adicionar foto), nunca de ler a galeria.
 */
export function useSaveTicketImage(claim: Claim | undefined) {
  const snapshotRef = useRef<SnapshotView>(null);
  const capturing = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");

  const startCapture = (job: Job) => {
    capturing.current = false;
    setPhase(job);
  };

  const save = () => {
    if (phase !== "idle" || !claim) return;
    setPhase("asking");
    ensureWriteAccess()
      .then((granted) => {
        if (granted) return startCapture("save");
        setPhase("idle");
        openGalleryPermissionSheet();
      })
      .catch((error: unknown) => {
        setPhase("idle");
        fail(SAVE_FAILED, error);
      });
  };

  const share = () => {
    if (phase !== "idle" || !claim) return;
    // O Share do RN só manda arquivo no iOS; no Android vai o texto com código e loja.
    if (Platform.OS === "ios") return startCapture("share");
    shareText(claim);
  };

  const onSnapshotReady = () => {
    if (capturing.current || !claim || (phase !== "save" && phase !== "share")) return;
    capturing.current = true;
    const job = phase;
    nextFrame()
      .then(() => capture(snapshotRef.current, claim.code))
      .then((path) => (job === "save" ? saveImage(path) : shareImage(path, claim)))
      .catch((error: unknown) => fail(job === "save" ? SAVE_FAILED : SHARE_FAILED, error))
      .then(() => setPhase("idle"));
  };

  return {
    snapshotRef,
    snapshotVisible: phase === "save" || phase === "share",
    save,
    share,
    onSnapshotReady,
  };
}

/** Escrita só (iOS "adicionar fotos"; Android 13+ nem pede nada; ≤ 12 pede gravar no armazenamento). */
async function ensureWriteAccess(): Promise<boolean> {
  const current = await getPermissionsAsync(true, ["photo"]);
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await requestPermissionsAsync(true, ["photo"]);
  return asked.granted;
}

/** Espera o QR (SVG) e o texto desenharem antes de capturar. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/** Captura o bilhete num PNG temporário e devolve o caminho (o iOS devolve sem `file://`). */
async function capture(view: SnapshotView | null, code: string): Promise<string> {
  if (!view) throw new Error("Bilhete para imagem não montado");
  // Sem width/height: sai na escala do aparelho (o TicketSnapshot já mede 1080 px de largura).
  return captureRef(view, {
    format: "png",
    quality: 1,
    result: "tmpfile",
    fileName: snapshotFileName(code),
  });
}

async function saveImage(path: string): Promise<void> {
  await Asset.create(toFileUri(path));
  releaseCapture(path);
  haptic.success();
  toast.show("Cupom salvo na galeria", "download", { haptic: "none" });
}

async function shareImage(path: string, claim: Claim): Promise<void> {
  await Share.share({ url: toFileUri(path), message: ticketShareText(claim) });
  releaseCapture(path);
}

function shareText(claim: Claim) {
  Share.share({ title: "Meu cupom ARP", message: ticketShareText(claim) }).catch((error: unknown) =>
    fail(SHARE_FAILED, error),
  );
}

function fail(message: string, error: unknown) {
  if (__DEV__) console.warn("[cupom → imagem]", error);
  haptic.error();
  toast.show(message, "circle-alert", { haptic: "none" });
}
