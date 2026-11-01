import { memo } from "react";
import Svg, { Path, Rect } from "react-native-svg";
import { useColors } from "@/design";
import { QR_QUIET_ZONE, qrBoxModules, qrModules, qrPath } from "../lib/qr";

type QrCodeProps = {
  value: string;
  size: number;
};

/**
 * QR Code num único `<Path>` (um subcaminho por sequência de módulos escuros), preto puro no branco:
 * lê melhor no leitor do caixa e sob luz forte. Correção de erro "M". `paper`/`onPaper` são
 * branco e preto nos dois temas: o QR nunca inverte no escuro (leitores esperam fundo claro).
 */
export const QrCode = memo(function QrCode({ value, size }: QrCodeProps) {
  const colors = useColors();
  const modules = qrModules(value);
  const box = qrBoxModules(modules.size);
  const d = qrPath(modules.data, modules.size, QR_QUIET_ZONE);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${box} ${box}`}>
      <Rect width={box} height={box} fill={colors.paper} />
      <Path d={d} fill={colors.onPaper} />
    </Svg>
  );
});
