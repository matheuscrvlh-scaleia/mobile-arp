import { describe, expect, it } from "@jest/globals";
import QRCode from "qrcode";
import { qrPath } from "./qr";

describe("qrPath", () => {
  it("junta módulos escuros vizinhos da linha e desloca pela margem", () => {
    // 3x3: linha 0 = ■■□, linha 1 = □□□, linha 2 = ■□■
    const data = [1, 1, 0, 0, 0, 0, 1, 0, 1];
    expect(qrPath(data, 3, 2)).toBe("M2 2h2v1h-2zM2 4h1v1h-1zM4 4h1v1h-1z");
    expect(qrPath([0, 0, 0, 0], 2, 2)).toBe("");
  });

  it("monta o caminho de um código real (ECL M)", () => {
    const { modules } = QRCode.create("ARP-7K2Q9", { errorCorrectionLevel: "M" });
    const d = qrPath(modules.data, modules.size, 2);
    expect(modules.size).toBe(21);
    // os três padrões de posição começam no canto superior esquerdo: 7 módulos seguidos
    expect(d.startsWith("M2 2h7v1h-7z")).toBe(true);
  });
});
