import type { AuthUser } from "@/contracts/auth";
import { merchantSession } from "@/core/merchant/merchant-session";
import { Button, SheetActions, SheetIcon, SheetText, SheetTitle, sheet, toast } from "@/design";
import { goBackOr } from "@/navigation/navigate";

/** Sai do painel e volta ao Perfil (de onde a área do lojista abre). */
function signOutMerchant(): void {
  // Navega antes: a tela do painel não deve reagir à sessão encerrada (Redirect) enquanto sai.
  goBackOr("/perfil");
  void merchantSession.signOut();
  toast.show("Você saiu do painel do lojista", "log-out");
}

export function openMerchantSignOutSheet(): void {
  sheet.message({
    icon: "log-out",
    iconBackground: "dangerSoft",
    iconColor: "dangerText",
    title: "Sair do painel do lojista?",
    text: "Para validar cupons de novo, entre com o e-mail e a senha do painel. Sua conta de visitante neste aparelho continua conectada.",
    actions: [
      { label: "Sair do painel", icon: "log-out", onPress: signOutMerchant },
      { label: "Continuar no painel" },
    ],
  });
}

export type MerchantMenuOptions = {
  user: Pick<AuthUser, "name" | "email" | "role">;
  /** Usuário sem loja (administração): pode trocar o caixa em que age. */
  onSwitchStore?: () => void;
  onChangePassword: () => void;
};

/** Menu do cabeçalho do painel: trocar loja (se puder), trocar senha e sair. */
export function openMerchantMenu({ user, onSwitchStore, onChangePassword }: MerchantMenuOptions) {
  sheet.open(({ closeThen }) => (
    <>
      <SheetIcon name="store" background="inverse" />
      <SheetTitle>{user.name}</SheetTitle>
      <SheetText>
        {user.email} · {user.role.name}
      </SheetText>
      <SheetActions>
        {onSwitchStore ? (
          <Button
            label="Trocar de loja"
            variant="soft"
            iconLeft="repeat"
            onPress={closeThen(onSwitchStore)}
          />
        ) : null}
        <Button
          label="Trocar senha"
          variant="soft"
          iconLeft="lock"
          onPress={closeThen(onChangePassword)}
        />
        <Button
          label="Sair do painel"
          variant="soft"
          iconLeft="log-out"
          onPress={closeThen(openMerchantSignOutSheet)}
        />
      </SheetActions>
    </>
  ));
}
