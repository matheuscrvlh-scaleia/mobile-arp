import { describe, expect, it, jest } from "@jest/globals";
import { overlayStore, sheet, toast } from "./overlay/store";
import { themes } from "./theme/theme";
import { cssAngle, fontFamily, tracking, withAlpha } from "./tokens";

const { toneOf } = themes.light;

/* Só módulos puros: o jest do projeto ainda não inicializa o Reanimated 4/worklets nem
   transforma o ESM do lucide-react-native, então os componentes não renderizam aqui. */
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light" },
}));

describe("tokens", () => {
  it("arredonda pesos do CSS para cima, como o navegador", () => {
    expect(fontFamily(650)).toBe("Geist_700Bold");
    expect(fontFamily(750)).toBe("Geist_800ExtraBold");
    expect(fontFamily(850)).toBe("Geist_900Black");
    expect(fontFamily(400)).toBe("Geist_400Regular");
  });

  it("tracking em px e ângulo de gradiente", () => {
    expect(tracking(32, -0.04)).toBe(-1.28);
    const g = cssAngle(135);
    expect(g.start.x).toBeCloseTo(0);
    expect(g.start.y).toBeCloseTo(0);
    expect(g.end.x).toBeCloseTo(1);
    expect(g.end.y).toBeCloseTo(1);
    expect(toneOf(null).fg).toBe("#ffffff");
    expect(toneOf("sand").fg).toBe("#141714");
  });
});

describe("withAlpha", () => {
  it("aplica alfa em hex curto, longo e rgba", () => {
    expect(withAlpha("#58c069", 0.3)).toBe("rgba(88, 192, 105, 0.3)");
    expect(withAlpha("#fff", 0)).toBe("rgba(255, 255, 255, 0)");
    expect(withAlpha("rgba(88, 192, 105, 0.5)", 0.5)).toBe("rgba(88, 192, 105, 0.25)");
    expect(withAlpha("rgb(0, 0, 0)", 2)).toBe("rgba(0, 0, 0, 1)");
    expect(withAlpha("transparent", 0.5)).toBe("transparent");
  });
});

describe("overlay", () => {
  it("toast some sozinho", () => {
    jest.useFakeTimers();
    toast.show("Código copiado", "copy");
    expect(overlayStore.getState().toast?.message).toBe("Código copiado");
    jest.advanceTimersByTime(2800);
    expect(overlayStore.getState().toast).toBeNull();
    jest.useRealTimers();
  });

  it("sheet abre, fecha e chama onClose", () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    sheet.open("Painel", { onClose });
    expect(sheet.isOpen()).toBe(true);
    sheet.close();
    expect(overlayStore.getState().sheet?.closing).toBe(true);
    jest.advanceTimersByTime(700);
    expect(overlayStore.getState().sheet).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
