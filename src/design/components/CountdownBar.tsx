import { useNow } from "@/shared/hooks/useNow";
import { type CountdownTarget, toTimestamp } from "./Countdown";
import { ProgressBar, type ProgressBarProps } from "./ProgressBar";

export type CountdownBarProps = Omit<ProgressBarProps, "value"> & {
  from: CountdownTarget;
  to: CountdownTarget;
};

/** Barra que esvazia de `from` até `to` (tempo que resta para usar o cupom). */
export function CountdownBar({
  from,
  to,
  duration = 1000,
  linear = true,
  ...bar
}: CountdownBarProps) {
  const now = useNow();
  const start = toTimestamp(from);
  const end = toTimestamp(to);
  const total = end - start;
  const value = total > 0 ? (end - now) / total : 0;
  return <ProgressBar {...bar} value={value} duration={duration} linear={linear} />;
}
