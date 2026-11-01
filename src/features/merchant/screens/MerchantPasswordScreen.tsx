import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect, useRouter } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, type TextInputInstance } from "react-native";
import type { z } from "zod";
import { changePasswordBodySchema } from "@/contracts/auth";
import { errorMessage } from "@/core/api/errors";
import { merchantSession, useMerchantSession } from "@/core/merchant/merchant-session";
import { Button, Pill, toast } from "@/design";
import { goBackOr } from "@/navigation/navigate";
import { AuthField } from "@/shared/form/AuthField";
import { FormScaffold } from "@/shared/form/FormScaffold";
import { applyServerErrors } from "@/shared/form/form-errors";
import { FIELD_MAX } from "@/shared/form/limits";
import { PrivacyNote } from "@/shared/form/PrivacyNote";
import { haptic } from "@/shared/lib/haptics";
import { useChangeMerchantPassword } from "../api/merchant";
import { openMerchantSignOutSheet } from "../sheets/merchant-sheets";

type PasswordForm = z.input<typeof changePasswordBodySchema>;

/**
 * /lojista/senha: troca a senha do painel. Obrigatória no primeiro acesso (`mustChangePassword`:
 * o painel manda para cá) ou pelo menu. A API mantém este login e derruba os outros.
 */
export default function MerchantPasswordScreen() {
  const router = useRouter();
  const status = useMerchantSession((s) => s.status);
  const forced = useMerchantSession((s) => s.profile?.user.mustChangePassword ?? false);
  const change = useChangeMerchantPassword();
  const newRef = useRef<TextInputInstance>(null);

  const form = useForm<PasswordForm, unknown, z.output<typeof changePasswordBodySchema>>({
    resolver: zodResolver(changePasswordBodySchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });
  const { control, handleSubmit, formState } = form;

  const submit = handleSubmit(async (values) => {
    try {
      await change.mutateAsync(values);
      merchantSession.passwordChanged();
      haptic.success();
      toast.show("Senha trocada", "circle-check", { haptic: "none" });
      // Primeiro acesso: o painel ainda não está na pilha (veio por Redirect).
      if (forced) router.replace("/lojista");
      else goBackOr("/lojista");
    } catch (error) {
      if (applyServerErrors(form, error)) {
        haptic.error();
        return;
      }
      toast.show(errorMessage(error), "circle-alert", { haptic: "light" });
    }
  });
  const onSubmit = () => void submit();

  if (status === "signedOut") return <Redirect href="/lojista/entrar" />;

  return (
    <FormScaffold
      title={forced ? "Crie sua senha" : "Trocar senha"}
      lead={
        forced
          ? "No primeiro acesso, troque a senha provisória por uma só sua. Ela vale também no painel da ARP na web."
          : "A senha nova vale no app e no painel da ARP na web. Os outros aparelhos conectados saem."
      }
      headerRight={forced ? <Pill variant="clay" icon="lock" label="Obrigatório" /> : undefined}
      onBack={() => goBackOr("/perfil")}
      cta={
        <Button
          label="Salvar senha"
          iconRight="check"
          loading={change.isPending || formState.isSubmitting}
          onPress={onSubmit}
        />
      }
    >
      <Controller
        control={control}
        name="currentPassword"
        render={({ field, fieldState }) => (
          <AuthField
            ref={field.ref}
            icon="lock"
            label={forced ? "Senha provisória" : "Senha atual"}
            placeholder={forced ? "A senha que você recebeu" : "Sua senha de agora"}
            password
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={
              // vazio: a mensagem do schema é genérica; a do servidor ("Senha atual incorreta") vale
              fieldState.error?.type === "too_small" ? "Informe a senha" : fieldState.error?.message
            }
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            maxLength={FIELD_MAX.password}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => newRef.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="newPassword"
        render={({ field, fieldState }) => (
          <AuthField
            ref={(input) => {
              field.ref(input);
              newRef.current = input;
            }}
            icon="lock"
            label="Senha nova"
            placeholder="Crie uma senha"
            password
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            hint="Pelo menos 8 caracteres, com letra e número."
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={FIELD_MAX.password}
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
        )}
      />
      <PrivacyNote>
        Não use a mesma senha da sua conta de visitante. Quem atende no caixa com você deve ter um
        usuário próprio no painel.
      </PrivacyNote>
      {forced ? (
        <Button
          label="Sair do painel"
          variant="soft"
          iconLeft="log-out"
          onPress={() => openMerchantSignOutSheet()}
          style={styles.signOut}
        />
      ) : null}
    </FormScaffold>
  );
}

const styles = StyleSheet.create({ signOut: { marginTop: 18 } });
