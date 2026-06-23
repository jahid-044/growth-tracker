import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { loginSchema, type LoginFormValues } from "@/lib/loginSchema";
import { useAuth } from "@/context/AuthContext";
import { FormField, fieldClassName } from "@/components/ui/field";

interface LocationState {
  from?: { pathname?: string };
  justSignedUp?: boolean;
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const state = (location.state as LocationState | null) ?? null;
  const from = state?.from?.pathname ?? "/";
  const justSignedUp = Boolean(state?.justSignedUp);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginFormValues) {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const message = (err.response.data as { message?: string })?.message;
        if (err.response.status === 401) {
          setServerError(message ?? "Invalid credentials");
        } else {
          setServerError(message ?? "Something went wrong. Please try again.");
        }
        return;
      }
      setServerError("Unable to reach the server. Please check your connection and try again.");
    }
  }

  return (
    <form
      data-testid="login-form"
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-sm"
    >
      <h1 className="text-2xl font-semibold text-neutral-900">Log in</h1>

      {justSignedUp && (
        <p data-testid="signup-success" className="text-sm text-green-600">
          Account created. Please log in to continue.
        </p>
      )}

      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <input
          id="email"
          data-testid="email-input"
          type="email"
          autoComplete="email"
          className={fieldClassName}
          {...register("email")}
        />
      </FormField>

      <FormField label="Password" htmlFor="password" error={errors.password?.message}>
        <input
          id="password"
          data-testid="password-input"
          type="password"
          autoComplete="current-password"
          className={fieldClassName}
          {...register("password")}
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
        {isSubmitting ? "Logging in…" : "Log in"}
      </button>

      <p className="text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="font-medium text-neutral-900 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}

export default Login;
