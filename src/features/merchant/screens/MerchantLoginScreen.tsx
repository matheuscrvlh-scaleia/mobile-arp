import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { TextInputInstance } from "react-native";
import type { z } from "zod";
import { merchantLoginBodySchema } from "@/contracts/app/merchant";
import { errorMessage } from "@/core/api/errors";
import { merchantSession, useMerchantSession } from "@/core/merchant/merchant-session";
import { Button, Pill, toast } from "@/design";
import { goBackOr } from "@/navigation/navigate";
import { AuthField } from "@/shared/form/AuthField";
import { FormAlert } from "@/shared/form/FormAlert";
import { FormScaffold } from "@/shared/form/FormScaffold";
import { applyServerErrors } from "@/shared/form/form-errors";
import { FIELD_MAX } from "@/shared/form/limits";
import { PrivacyNote } from "@/shared/form/PrivacyNote";
import { useRateLimit } from "@/shared/hooks/useRateLimit";
import { haptic } from "@/shared/lib/haptics";
import { useMerchantLogin } from "../api/merchant";
import { loginAlert } from "../lib/login";

type LoginForm = z.input<typeof merchantLoginBodySchema>;

/** /lojista/entrar: login do painel do lojista (sessão própria, separada da conta de visitante). */
export default function MerchantLoginScreen() {
  // Só na abertura: depois do login quem navega é o `submit` (evita navegar duas vezes).
  const [alreadyIn] = useState(() => useMerchantSession.getState().status === "signedIn");
  const router = useRouter();
  const login = useMerchantLogin();
  const rateLimit = useRateLimit();
  const passwordRef = useRef<TextInputInstance>(null);

  const form = useForm<LoginForm, unknown, z.output<typeof merchantLoginBodySchema>>({
    resolver: zodResolver(merchantLoginBodySchema),
    defaultValues: { email: "", password: "" },
  });
  const { control, handleSubmit, setError, setFocus, formState, clearErrors } = form;
  const alert = rateLimit.message ?? formState.errors.root?.message;

  const submit = handleSubmit(async (values) => {
    clearErrors("root");
    try {
      const session = await login.mutateAsync(values);
      await merchantSession.signIn(session);
      haptic.success();
      router.replace("/lojista");
    } catch (error) {
      const known = loginAlert(error);
      if (known) {
        haptic.error();
        setError("root", { message: known });
        setFocus("password");
        return;
      }
      if (rateLimit.block(error)) {
        haptic.error();
        return;
      }
      if (applyServerErrors(form, error)) return;
      toast.show(errorMessage(error), "circle-alert", { haptic: "light" });
    }
  });
  // Enviar pelo teclado também respeita a espera do 429.
  const onSubmit = () => {
    if (!rateLimit.blocked) void submit();
  };

  // Já tinha entrado: o painel decide o resto (senha, loja).
  if (alreadyIn) return <Redirect href="/lojista" />;

  return (
    <FormScaffold
      title="Área do lojista"
      lead="Entre com o e-mail e a senha do painel da ARP para validar cupons no caixa e acompanhar os números da sua loja."
      headerRight={<Pill icon="store" label="Lojista" />}
      onBack={() => goBackOr("/perfil")}
      cta={
        <Button
          label="Entrar no painel"
          iconRight="arrow-right"
          loading={login.isPending || formState.isSubmitting}
          disabled={rateLimit.blocked}
          onPress={onSubmit}
        />
      }
    >
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <AuthField
            ref={field.ref}
            icon="mail"
            label="E-mail do painel"
            placeholder="loja@email.com"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            maxLength={FIELD_MAX.email}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <AuthField
            ref={(input) => {
              field.ref(input);
              passwordRef.current = input;
            }}
            icon="lock"
            label="Senha"
            placeholder="Sua senha do painel"
            password
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            maxLength={FIELD_MAX.password}
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
        )}
      />
      {alert ? <FormAlert message={alert} /> : null}
      <PrivacyNote>
        Esta área é para quem atende no caixa das lojas da ARP. Sua conta de visitante neste
        aparelho continua como está.
      </PrivacyNote>
    </FormScaffold>
  );
}
