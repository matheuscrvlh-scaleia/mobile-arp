import type { ComponentRef, Ref } from "react";
import { PixelRatio, StyleSheet, View } from "react-native";
import type { Claim } from "@/contracts/app/coupons";
import { fontFamily, Icon, lightPalette, Text, Trevo, tracking } from "@/design";
import { crispQrPixels, qrBoxModules, qrModules } from "../lib/qr";
import { SNAPSHOT_QR_MIN_PX, snapshotUnit, validUntilLabel } from "../lib/ticket-image";
import { QrCode } from "./QrCode";

/**
 * Paleta CLARA fixa, de propósito (não segue o tema): a imagem vai para a galeria e é mostrada
 * no caixa, em outro aparelho, impressa ou com o brilho no máximo. Precisa sair sempre igual,
 * com texto escuro sobre branco e o QR preto no branco, mesmo que o visitante use o tema escuro.
 */
const LIGHT = lightPalette;

type TicketSnapshotProps = {
  claim: Claim;
  /** "Bloco · Piso" da loja, quando já carregado (vem do cache, funciona offline). */
  location?: string;
  ref: Ref<ComponentRef<typeof View>>;
  /** Primeiro layout: a view já existe no nativo e pode ser capturada. */
  onReady: () => void;
};

/**
 * Versão "para imagem" do bilhete, desenhada fora da tela só durante a captura:
 * fundo sólido, texto em alto contraste (paleta clara nos dois temas), QR preto no branco com
 * pixels inteiros por módulo
 * e sem nada animado (o contador regressivo vira "Válido até dd/mm às HH:mm").
 * Tudo é medido em unidades de 360 de largura e sai com 1080 px em qualquer aparelho.
 */
export function TicketSnapshot({ claim, location, ref, onReady }: TicketSnapshotProps) {
  const ratio = PixelRatio.get();
  const { s, icon } = snapshotStyles(snapshotUnit(ratio));
  const qrSize =
    crispQrPixels(qrBoxModules(qrModules(claim.code).size), SNAPSHOT_QR_MIN_PX) / ratio;

  return (
    <View
      ref={ref}
      collapsable={false}
      onLayout={onReady}
      style={s.root}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={s.brandRow}>
        <Trevo size={icon.trevo} color={LIGHT.onMedia} />
        <Text style={s.brandText} color={LIGHT.text} allowFontScaling={false}>
          Cupom ARP
        </Text>
      </View>

      <View style={s.card}>
        <View style={s.head}>
          <View style={[s.mono, { backgroundColor: claim.store.brandColor }]}>
            <Icon name={claim.store.icon} size={icon.mono} color={LIGHT.onMedia} />
          </View>
          <View style={s.headText}>
            <Text style={s.store} color={LIGHT.text} numberOfLines={2} allowFontScaling={false}>
              {claim.store.name}
            </Text>
            {location ? (
              <Text
                style={s.location}
                color={LIGHT.textSecondary}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {location}
              </Text>
            ) : null}
          </View>
        </View>
        <Text style={s.offer} color={LIGHT.text} numberOfLines={3} allowFontScaling={false}>
          {claim.coupon.title}
        </Text>

        <View style={s.rule} />

        <View style={s.qr}>
          <QrCode value={claim.code} size={qrSize} />
        </View>
        <Text style={s.code} color={LIGHT.onPaper} align="center" allowFontScaling={false}>
          {claim.code}
        </Text>

        <View style={s.valid}>
          <Icon name="clock" size={icon.valid} color={LIGHT.text} strokeWidth={2.4} />
          <Text style={s.validText} color={LIGHT.text} allowFontScaling={false}>
            {validUntilLabel(claim.expiresAt)}
          </Text>
        </View>
        <Text style={s.where} color={LIGHT.textSecondary} align="center" allowFontScaling={false}>
          Mostre este código no caixa da {claim.store.name}
        </Text>
      </View>
    </View>
  );
}

/* Estilos por escala (uma por densidade de tela, criados uma vez). */
const cache = new Map<number, ReturnType<typeof buildStyles>>();

function snapshotStyles(unit: number) {
  let styles = cache.get(unit);
  if (!styles) {
    styles = buildStyles(unit);
    cache.set(unit, styles);
  }
  return styles;
}

function buildStyles(unit: number) {
  const u = (n: number) => PixelRatio.roundToNearestPixel(n * unit);
  const font = (size: number, line: number, weight: Parameters<typeof fontFamily>[0], em = 0) => ({
    fontFamily: fontFamily(weight),
    fontSize: u(size),
    lineHeight: u(line),
    letterSpacing: tracking(u(size), em),
  });
  const icon = { trevo: u(26), mono: u(22), valid: u(18) };
  const s = StyleSheet.create({
    // Fora da tela (não some do nativo como `display: none`, que não pode ser capturado).
    root: {
      position: "absolute",
      top: 0,
      left: -100_000,
      pointerEvents: "none",
      width: u(360),
      padding: u(20),
      backgroundColor: LIGHT.brand,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: u(8),
      paddingHorizontal: u(4),
      paddingBottom: u(14),
    },
    brandText: font(18, 24, 900, -0.02),
    card: {
      backgroundColor: LIGHT.paper,
      borderRadius: u(26),
      paddingVertical: u(24),
      paddingHorizontal: u(22),
    },
    head: { flexDirection: "row", alignItems: "center", gap: u(12) },
    mono: {
      width: u(44),
      height: u(44),
      borderRadius: u(14),
      alignItems: "center",
      justifyContent: "center",
    },
    headText: { flex: 1, minWidth: 0 },
    store: font(17, 22, 700),
    location: font(13, 18, 500),
    offer: { ...font(24, 27, 850, -0.04), marginTop: u(14) },
    rule: { height: u(2), backgroundColor: LIGHT.border, marginVertical: u(20) },
    qr: { alignSelf: "center" },
    code: { ...font(30, 36, 800, 0.12), marginTop: u(16) },
    valid: {
      marginTop: u(14),
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: u(8),
      paddingVertical: u(8),
      paddingHorizontal: u(14),
      borderRadius: u(14),
      backgroundColor: LIGHT.brand50,
    },
    validText: font(16, 22, 700),
    where: { ...font(13, 18, 500), marginTop: u(14) },
  });
  return { s, icon };
}
