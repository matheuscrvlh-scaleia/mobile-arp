/* Último selo ganho, só em memória: a tela de celebração lê daqui (não vai na URL). */
import { create } from "zustand";
import type { ScanResult } from "@/contracts/app/challenges";

interface LastSealState {
  result: ScanResult | null;
}

export const useLastSeal = create<LastSealState>(() => ({ result: null }));

export const lastSeal = {
  set(result: ScanResult): void {
    useLastSeal.setState({ result });
  },
  clear(): void {
    useLastSeal.setState({ result: null });
  },
};
