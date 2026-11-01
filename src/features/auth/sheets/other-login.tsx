import { router } from "expo-router";
import type { SocialProvider } from "@/contracts/app/auth";
import { Button, SheetActions, SheetIcon, SheetText, SheetTitle, sheet } from "@/design";
import { type AccountMethod, PROVIDER_LABEL } from "../lib/social-errors";

export type OtherLoginActions = {
  /** Conta com senha: ir para o Entrar com o e-mail preenchido. */
  onPassword: (email: string | null) => void;
  /** Conta Google/Apple: entrar com esse provedor (se ele existe neste aparelho). */
  onProvider: (provider: SocialProvider) => void;
  /** O provedor da conta existe neste aparelho? (Apple só no iPhone; Google com client id). */
  isAvailable: (provider: SocialProvider) => boolean;
};

const ARTICLE: Record<SocialProvider, string> = { google: "o", apple: "a" };

/**
 * 409 EMAIL_USES_OTHER_LOGIN: uma conta entra por um método só. Mostra qual
 * é e leva para o caminho certo.
 */
export function openOtherLoginSheet(
  method: AccountMethod,
  email: string | null,
  actions: OtherLoginActions,
): void {
  if (method === "password") {
    sheet.open(({ closeThen }) => (
      <>
        <SheetIcon name="lock" background="surface" />
        <SheetTitle>Este e-mail já tem conta com senha</SheetTitle>
        <SheetText>
          {email ? `A conta ${email}` : "A conta deste e-mail"} entra com e-mail e senha. Se não
          lembrar a senha, dá para criar uma nova.
        </SheetText>
        <SheetActions>
          <Button
            label="Entrar com e-mail e senha"
            iconRight="arrow-right"
            onPress={closeThen(() => actions.onPassword(email))}
          />
          <Button
            label="Esqueci minha senha"
            variant="soft"
            onPress={closeThen(() =>
              router.push(
                email ? { pathname: "/senha/esqueci", params: { email } } : "/senha/esqueci",
              ),
            )}
          />
        </SheetActions>
      </>
    ));
    return;
  }

  const label = PROVIDER_LABEL[method];
  const article = ARTICLE[method];
  const here = actions.isAvailable(method);
  sheet.open(({ close, closeThen }) => (
    <>
      <SheetIcon name="user" background="surface" />
      <SheetTitle>
        Este e-mail já tem conta com {article} {label}
      </SheetTitle>
      <SheetText>
        {here
          ? `Para entrar nessa conta, use o botão "Continuar com ${article} ${label}".`
          : method === "apple"
            ? "Essa conta entra com a Apple, o que só dá para fazer num iPhone. Entre por lá ou use outro e-mail."
            : "Essa conta entra com o Google, que não está disponível neste aparelho agora. Tente mais tarde ou use outro e-mail."}
      </SheetText>
      <SheetActions>
        {here ? (
          <>
            <Button
              label={`Entrar com ${article} ${label}`}
              iconRight="arrow-right"
              onPress={closeThen(() => actions.onProvider(method))}
            />
            <Button label="Agora não" variant="soft" onPress={close} />
          </>
        ) : (
          <Button label="Entendi" onPress={close} />
        )}
      </SheetActions>
    </>
  ));
}
