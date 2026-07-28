import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { buildLoginSchema, type LoginFormValues } from "@/lib/loginSchema";
import { useAuth } from "@/context/AuthContext";
import { FormField, fieldClassName } from "@/components/ui/field";
import { useFocusGuard } from "@/hooks/useFocusGuard";
import { translateServerError } from "@/lib/serverErrorMessages";

interface LocationState {
  from?: { pathname?: string };
  justSignedUp?: boolean;
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams<{ lang: string }>();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);

  const state = (location.state as LocationState | null) ?? null;
  const from = state?.from?.pathname ?? `/${lang}`;
  const justSignedUp = Boolean(state?.justSignedUp);

  const schema = useMemo(() => buildLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const emailGuard = useFocusGuard();
  const passwordGuard = useFocusGuard();

  const { onBlur: emailOnBlur, ...emailRegister } = register("email");
  const { onBlur: passwordOnBlur, ...passwordRegister } = register("password");

  async function onSubmit(data: LoginFormValues) {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const payload = err.response.data as { code?: string; message?: string } | undefined;
        setServerError(translateServerError(payload, t));
        return;
      }
      setServerError(t("auth.errors.networkUnreachable"));
    }
  }

  return (
    <form
      data-testid="login-form"
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-sm"
    >
      <h1 className="text-2xl font-semibold text-neutral-900">{t("auth.login.title")}</h1>

      {justSignedUp && (
        <p data-testid="signup-success" className="text-sm text-green-600">
          {t("auth.login.signupSuccess")}
        </p>
      )}

      <FormField label={t("common.email")} htmlFor="email" error={!emailGuard.focused ? errors.email?.message : undefined}>
        <input
          id="email"
          data-testid="email-input"
          type="email"
          autoComplete="email"
          className={fieldClassName}
          {...emailRegister}
          onFocus={emailGuard.onFocus}
          onBlur={(e) => { void emailOnBlur(e); emailGuard.onBlur(); }}
        />
      </FormField>

      <FormField label={t("common.password")} htmlFor="password" error={!passwordGuard.focused ? errors.password?.message : undefined}>
        <input
          id="password"
          data-testid="password-input"
          type="password"
          autoComplete="current-password"
          className={fieldClassName}
          {...passwordRegister}
          onFocus={passwordGuard.onFocus}
          onBlur={(e) => { void passwordOnBlur(e); passwordGuard.onBlur(); }}
        />
      </FormField>

      {serverError && (
        <p data-testid="error-message" className="text-sm text-red-600">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        data-testid="submit-btn"
        disabled={isSubmitting}
        className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
      </button>

      <p className="text-center text-sm text-neutral-500">
        {t("auth.login.noAccount")}{" "}
        <Link to={`/${lang}/signup`} className="font-medium text-neutral-900 hover:underline">
          {t("auth.login.signUpLink")}
        </Link>
      </p>
    </form>
  );
}

export default Login;
