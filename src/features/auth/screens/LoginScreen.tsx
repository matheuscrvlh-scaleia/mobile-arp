import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import type { TextInputInstance } from "react-native";
import type { z } from "zod";
import { loginBodySchema } from "@/contracts/app/auth";
import { errorMessage, isApiError } from "@/core/api/errors";
import { Button, toast } from "@/design";
import { AuthField } from "@/shared/form/AuthField";
import { FormAlert } from "@/shared/form/FormAlert";
import { FormScaffold } from "@/shared/form/FormScaffold";
import { applyServerErrors } from "@/shared/form/form-errors";
import { FIELD_MAX } from "@/shared/form/limits";
import { PrivacyNote } from "@/shared/form/PrivacyNote";
import { useRateLimit } from "@/shared/hooks/useRateLimit";
import { haptic } from "@/shared/lib/haptics";
import { useLoginMutation } from "../api/auth";
import { OrDivider } from "../components/OrDivider";
import { SocialButtons } from "../components/SocialButtons";
import { TextLink } from "../components/TextLink";
import { useCompleteAuth } from "../hooks/useCompleteAuth";
import { useSocialLogin } from "../hooks/useSocialLogin";

type LoginForm = z.input<typeof loginBodySchema>;

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const completeAuth = useCompleteAuth();
  const login = useLoginMutation();
  const rateLimit = useRateLimit();
  const passwordRef = useRef<TextInputInstance>(null);

  const form = useForm<LoginForm, unknown, z.output<typeof loginBodySchema>>({
    resolver: zodResolver(loginBodySchema),
    defaultValues: { email: typeof params.email === "string" ? params.email : "", password: "" },
  });
  const { control, handleSubmit, setError, setFocus, getValues, setValue, formState, clearErrors } =
    form;
  const social = useSocialLogin({
    completeAuth,
    // Conta Google/Apple tentada com e-mail que entra com senha: já está no Entrar.
    onUsePassword: (email) => {
      clearErrors();
      if (email) setValue("email", email);
      setFocus(email ? "password" : "email");
    },
  });
  const alert = rateLimit.message ?? formState.errors.root?.message;

  const submit = handleSubmit(async (values) => {
    clearErrors("root");
    try {
      const session = await login.mutateAsync(values);
      await completeAuth(session, "login");
    } catch (error) {
      if (isApiError(error) && error.code === "INVALID_CREDENTIALS") {
        haptic.error();
        setError("root", { message: "E-mail ou senha incorretos. Confira e tente de novo." });
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

  return (
    <FormScaffold
      title="Que bom te ver"
      lead="Entre na sua conta ARP para usar seus cupons e selos."
      cta={
        <Button
          label="Entrar"
          iconRight="arrow-right"
          loading={login.isPending}
          disabled={rateLimit.blocked || social.busy !== null}
          onPress={onSubmit}
        />
      }
    >
      <SocialButtons
        available={social.available}
        busy={social.busy}
        onPress={(provider) => void social.start(provider)}
        dividerLabel="ou com e-mail e senha"
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <AuthField
            ref={field.ref}
            icon="mail"
            label="E-mail"
            placeholder="voce@email.com"
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
            placeholder="Sua senha"
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
      <TextLink
        label="Esqueci minha senha"
        align="right"
        onPress={() => {
          const email = getValues("email").trim();
          router.push(email ? { pathname: "/senha/esqueci", params: { email } } : "/senha/esqueci");
        }}
      />
      <PrivacyNote>
        Sem conta você continua consultando lojas, eventos e o mapa. A conta serve para cupons,
        selos e favoritos.
      </PrivacyNote>
      <OrDivider label="primeira vez aqui?" />
      <TextLink
        prefix="Ainda não tenho conta · "
        label="Criar conta"
        onPress={() => {
          const email = getValues("email").trim();
          router.replace(email ? { pathname: "/cadastro", params: { email } } : "/cadastro");
        }}
      />
    </FormScaffold>
  );
}
