import { Linking } from "react-native";
import { sheet } from "@/design";

/** Painel de "sem permissão para salvar na galeria": o sistema não pergunta de novo, só nos ajustes. */
export function openGalleryPermissionSheet() {
  sheet.message({
    icon: "image",
    iconBackground: "dangerSoft",
    iconColor: "dangerText",
    title: "Permita salvar na galeria",
    text: "Para guardar o cupom como imagem, libere o ARP para adicionar fotos nos ajustes do aparelho. O app só salva a imagem, sem ver suas outras fotos.",
    actions: [
      {
        label: "Abrir ajustes",
        icon: "settings",
        onPress: () => void Linking.openSettings().catch(() => undefined),
      },
      { label: "Agora não", variant: "soft" },
    ],
  });
}
