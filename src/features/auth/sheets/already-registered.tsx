import { Button, SheetActions, SheetIcon, SheetText, SheetTitle, sheet } from "@/design";

/** Cadastro com e-mail que já tem conta: entrar com ele ou trocar de e-mail. */
export function openAlreadyRegisteredSheet(
  email: string,
  actions: { onLogin: () => void; onOtherEmail: () => void },
): void {
  sheet.open(({ closeThen }) => (
    <>
      <SheetIcon name="user" background="surface" />
      <SheetTitle>Você já tem conta</SheetTitle>
      <SheetText>
        O e-mail {email} já está cadastrado na ARP. Entre com ele ou use outro e-mail.
      </SheetText>
      <SheetActions>
        <Button
          label="Entrar com este e-mail"
          iconRight="arrow-right"
          onPress={closeThen(actions.onLogin)}
        />
        <Button
          label="Usar outro e-mail"
          variant="soft"
          onPress={closeThen(actions.onOtherEmail)}
        />
      </SheetActions>
    </>
  ));
}
