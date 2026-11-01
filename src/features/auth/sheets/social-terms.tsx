import { useState } from "react";
import { StyleSheet } from "react-native";
import type { SocialProvider } from "@/contracts/app/auth";
import {
  Button,
  SheetActions,
  type SheetApi,
  SheetIcon,
  SheetText,
  SheetTitle,
  sheet,
} from "@/design";
import { CheckRow } from "../components/CheckRow";
import { PROVIDER_LABEL } from "../lib/social-errors";

type Accept = (choice: { marketingOptIn: boolean }) => void;

function TermsBody({
  provider,
  onAccept,
  api,
}: {
  provider: SocialProvider;
  onAccept: Accept;
  api: SheetApi;
}) {
  const [terms, setTerms] = useState(false);
  const [news, setNews] = useState(false);
  const [showError, setShowError] = useState(false);
  return (
    <>
      <SheetIcon name="sparkles" background="brand" />
      <SheetTitle>Falta só o aceite</SheetTitle>
      <SheetText>
        Ainda não há conta ARP com este e-mail do {PROVIDER_LABEL[provider]}. Para criar a sua,
        aceite os termos.
      </SheetText>
      <CheckRow
        checked={terms}
        onChange={(next) => {
          setTerms(next);
          if (next) setShowError(false);
        }}
        label="Li e aceito os termos de uso e a política de privacidade."
        error={showError ? "Aceite os termos para continuar" : undefined}
      />
      <CheckRow
        checked={news}
        onChange={setNews}
        label="Quero receber novidades e ofertas da ARP. (opcional)"
      />
      <SheetActions>
        <Button
          label="Criar conta"
          iconRight="arrow-right"
          style={styles.primary}
          onPress={() => {
            if (!terms) {
              setShowError(true);
              return;
            }
            api.closeThen(() => onAccept({ marketingOptIn: news }))();
          }}
        />
        <Button label="Agora não" variant="soft" onPress={api.close} />
      </SheetActions>
    </>
  );
}

/**
 * Conta nova pelo Google/Apple (422 TERMS_REQUIRED): aceite dos termos
 * (obrigatório) e das novidades (opcional, LGPD). Ao aceitar, a tela reenvia
 * o mesmo pedido com `acceptTerms: true`.
 */
export function openSocialTermsSheet(provider: SocialProvider, onAccept: Accept): void {
  sheet.open((api) => <TermsBody provider={provider} onAccept={onAccept} api={api} />);
}

const styles = StyleSheet.create({ primary: { marginTop: 20 } });
