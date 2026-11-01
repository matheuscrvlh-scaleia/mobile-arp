import { useEffect, useEffectEvent, useRef } from "react";
import { useNow } from "@/shared/hooks/useNow";
import { formatHMS } from "@/shared/lib/format";
import { Text, type TextProps } from "./Text";

export type CountdownTarget = string | number | Date;

export function toTimestamp(target: CountdownTarget): number {
  if (typeof target === "number") return target;
  if (target instanceof Date) return target.getTime();
  return Date.parse(target);
}

export type CountdownProps = Omit<TextProps, "children"> & {
  /** Fim: ISO, timestamp em ms ou Date. */
  to: CountdownTarget;
  /** Chamado uma vez quando chega a 00:00:00. */
  onEnd?: () => void;
};

/** "HH:MM:SS" até `to`, no relógio compartilhado (useNow). */
export function Countdown({ to, onEnd, tabular = true, ...text }: CountdownProps) {
  const now = useNow();
  const end = toTimestamp(to);
  const left = end - now;
  const ended = !(left > 0);

  const fired = useRef(false);
  const fireEnd = useEffectEvent(() => onEnd?.());

  useEffect(() => {
    if (!ended) {
      fired.current = false;
      return;
    }
    if (!fired.current) {
      fired.current = true;
      fireEnd();
    }
  }, [ended]);

  return (
    <Text {...text} tabular={tabular} accessibilityLiveRegion="none">
      {formatHMS(left)}
    </Text>
  );
}
