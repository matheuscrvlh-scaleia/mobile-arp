import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import type { TextInputInstance } from "react-native";
import { z } from "zod";
import { registerBodySchema } from "@/contracts/app/auth";
import { errorMessage, isApiError } from "@/core/api/errors";
import { Button, Pill, toast } from "@/design";
import { AuthField } from "@/shared/form/AuthField";
import { FormAlert } from "@/shared/form/FormAlert";
import { FormScaffold } from "@/shared/form/FormScaffold";
import { applyServerErrors } from "@/shared/form/form-errors";
import { FIELD_MAX } from "@/shared/form/limits";
import { PrivacyNote } from "@/shared/form/PrivacyNote";
import { phoneFormSchema } from "@/shared/form/phone-schema";
import { useRateLimit } from "@/shared/hooks/useRateLimit";
import { haptic } from "@/shared/lib/haptics";
import { maskPhone, phoneForApi } from "@/shared/lib/phone";
import { useRegisterMutation } from "../api/auth";
import { CheckRow } from "../components/CheckRow";
import { OrDivider } from "../components/OrDivider";
import { PasswordHint } from "../components/PasswordHint";
import { SocialButtons } from "../components/SocialButtons";
import { TextLink } from "../components/TextLink";
import { useCompleteAuth } from "../hooks/useCompleteAuth";
import { useSocialLogin } from "../hooks/useSocialLogin";
import { openAlreadyRegisteredSheet } from "../sheets/already-registered";

/*
 * O mesmo schema do servidor (registerBodySchema), com dois ajustes de
 * formulário: o aceite começa desmarcado (boolean, LGPD) e o celular, se
 * preenchido, precisa estar completo.
 */
const signupFormSchema = registerBodySchema.extend({
  phone: phoneFormSchema,
  acceptTerms: z.boolean().refine((v) => v, "Aceite os termos para continuar"),
});
type SignupForm = z.input<typeof signupFormSchema>;

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const completeAuth = useCompleteAuth();
  const register = useRegisterMutation();
  const rateLimit = useRateLimit();
  const phoneRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const form = useForm<SignupForm, unknown, z.output<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: typeof params.email === "string" ? params.email : "",
      password: "",
      acceptTerms: false,
      marketingOptIn: false,
    },
  });
  const { control, handleSubmit, setError, setFocus, getValues } = form;

  const goToLogin = (email?: string) =>
    router.replace(email ? { pathname: "/entrar", params: { email } } : "/entrar");
  const social = useSocialLogin({
    completeAuth,
    // E-mail do Google/Apple que já tem conta com senha: vai para o Entrar com ele.
    onUsePassword: (email) => goToLogin(email ?? undefined),
  });

  const submit = handleSubmit(async (values) => {
    try {
      const session = await register.mutateAsync({
        name: values.name,
        email: values.email,
        phone: phoneForApi(values.phone),
        password: values.password,
        acceptTerms: true,
        marketingOptIn: values.marketingOptIn,
      });
      await completeAuth(session, "signup");
    } catch (error) {
      if (isApiError(error) && error.code === "CONFLICT") {
        setError("email", { message: "Este e-mail já tem conta." });
        openAlreadyRegisteredSheet(values.email, {
          onLogin: () => goToLogin(values.email),
          onOtherEmail: () => setFocus("email"),
        });
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
      title="Crie sua conta"
      lead="Para pegar cupons, cumprir desafios e ganhar selos. Só pedimos o essencial."
      headerRight={<Pill label="Leva 30 segundos" icon="timer" variant="brand" />}
      cta={
        <Button
          label="Criar conta"
          iconRight="arrow-right"
          loading={register.isPending}
          disabled={rateLimit.blocked || social.busy !== null}
          onPress={onSubmit}
        />
      }
    >
      <SocialButtons
        available={social.available}
        busy={social.busy}
        onPress={(provider) => void social.start(provider)}
        dividerLabel="ou com seus dados"
      />
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <AuthField
            ref={field.ref}
            icon="user"
            label="Nome"
            placeholder="Como você se chama"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={FIELD_MAX.name}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => phoneRef.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <AuthField
            ref={(input) => {
              field.ref(input);
              phoneRef.current = input;
            }}
            icon="smartphone"
            label="Celular (opcional)"
            placeholder="(24) 98888-1234"
            value={field.value}
            onChangeText={(text) => field.onChange(maskPhone(text))}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <AuthField
            ref={(input) => {
              field.ref(input);
              emailRef.current = input;
            }}
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
            // "username" liga o e-mail à senha salva pelo gerenciador de senhas (iOS)
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
          <>
            <AuthField
              ref={(input) => {
                field.ref(input);
                passwordRef.current = input;
              }}
              icon="lock"
              label="Senha"
              placeholder="Crie uma senha"
              password
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              passwordRules="minlength: 8; required: lower, upper; required: digit;"
              maxLength={FIELD_MAX.password}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
            {fieldState.error ? null : <PasswordHint value={field.value} />}
          </>
        )}
      />
      <Controller
        control={control}
        name="acceptTerms"
        render={({ field, fieldState }) => (
          <CheckRow
            checked={field.value}
            onChange={field.onChange}
            label="Li e aceito os termos de uso e a política de privacidade."
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="marketingOptIn"
        render={({ field }) => (
          <CheckRow
            checked={field.value ?? false}
            onChange={field.onChange}
            label="Quero receber novidades e ofertas da ARP. (opcional)"
          />
        )}
      />
      {rateLimit.message ? <FormAlert message={rateLimit.message} /> : null}
      <PrivacyNote>
        Não pedimos CPF nem endereço. Para consultar lojas, eventos e o mapa você nem precisa de
        conta.
      </PrivacyNote>
      <OrDivider label="já é da ARP?" />
      <TextLink
        prefix="Já tenho conta · "
        label="Entrar"
        onPress={() => goToLogin(getValues("email").trim() || undefined)}
      />
    </FormScaffold>
  );
}
