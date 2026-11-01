import { router } from "expo-router";
import { pendingAction } from "@/core/auth/pending-action";
import { isSignedIn } from "@/core/auth/session";
import { Button, SheetActions, SheetIcon, SheetText, SheetTitle, sheet } from "@/design";

interface GateCopy {
  title?: string;
  text?: string;
}

/**
 * Executa a ação se houver conta; senão abre o convite de cadastro e guarda a
 * ação para rodar logo depois de entrar ou cadastrar (o visitante volta ao que fazia).
 */
export function requireAuth(action: () => void | Promise<void>, copy: GateCopy = {}): void {
  if (isSignedIn()) {
    void Promise.resolve(action()).catch(() => undefined);
    return;
  }
  pendingAction.set(action);
  let proceeding = false;
  const go = (href: "/cadastro" | "/entrar") => () => {
    proceeding = true;
    router.push(href);
  };
  sheet.open(
    ({ closeThen }) => (
      <>
        <SheetIcon name="sparkles" background="brand" />
        <SheetTitle>{copy.title ?? "Crie sua conta para participar"}</SheetTitle>
        <SheetText>
          {copy.text ??
            "Leva 30 segundos. Com ela você pega cupons, ganha selos e acumula benefícios. Consultar lojas, eventos e mapa continua livre."}
        </SheetText>
        <SheetActions>
          <Button
            label="Criar conta"
            iconRight="arrow-right"
            onPress={closeThen(go("/cadastro"))}
          />
          <Button
            label="Já tenho conta · Entrar"
            variant="soft"
            onPress={closeThen(go("/entrar"))}
          />
        </SheetActions>
      </>
    ),
    // Fechar o convite sem seguir para a conta descarta a intenção.
    { onClose: () => (proceeding ? undefined : pendingAction.clear()) },
  );
}
