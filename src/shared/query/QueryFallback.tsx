import type { ReactNode } from "react";
import { errorMessage } from "@/core/api/errors";
import { ErrorState } from "@/design";
import type { QueryView } from "./query-view";

interface Props {
  view: Exclude<QueryView, "ready">;
  skeleton: ReactNode;
  error?: unknown;
  onRetry: () => void;
  retrying?: boolean;
}

/** O que a tela mostra enquanto não há dado: skeleton, sem conexão ou erro com retry. */
export function QueryFallback({ view, skeleton, error, onRetry, retrying }: Props) {
  if (view === "loading") return <>{skeleton}</>;
  return (
    <ErrorState
      offline={view === "offline"}
      message={view === "error" ? errorMessage(error) : undefined}
      onRetry={onRetry}
      retrying={retrying}
    />
  );
}
